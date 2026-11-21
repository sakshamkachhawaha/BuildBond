import { Router } from 'express';
import {
  assertProjectActive,
  getProjectById,
  getProjectForUser,
  requireClient,
} from '../access.js';
import { requireAuth, requireRole } from '../auth.js';
import { query, withTransaction } from '../db.js';
import { assert, HttpError, parseId } from '../http.js';
import { positiveInteger, text } from '../validate.js';
import { summarizeLedger } from '../domain.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user.id;

  const projectResult = await query(
    `SELECT
       p.*,
       c.name AS client_name,
       k.name AS contractor_name
     FROM projects p
     JOIN users c ON c.id = p.client_id
     LEFT JOIN users k ON k.id = p.contractor_id
     WHERE p.client_id = $1 OR p.contractor_id = $1
     ORDER BY p.created_at DESC, p.id DESC`,
    [userId],
  );

  const projects = projectResult.rows;

  if (projects.length === 0) {
    return res.json({ projects: [] });
  }

  const projectIds = projects.map((project) => project.id);

  const [milestoneResult, ledgerResult, disputeResult] = await Promise.all([
    query(
      `SELECT id, project_id, position, title, amount_paise, status
       FROM milestones
       WHERE project_id = ANY($1::int[])
       ORDER BY project_id, position`,
      [projectIds],
    ),
    query(
      `SELECT project_id, kind, amount_paise
       FROM ledger_entries
       WHERE project_id = ANY($1::int[])`,
      [projectIds],
    ),
    query(
      `SELECT project_id, milestone_id
       FROM disputes
       WHERE status = 'OPEN' AND project_id = ANY($1::int[])`,
      [projectIds],
    ),
  ]);

  const milestonesByProject = new Map();
  for (const milestone of milestoneResult.rows) {
    const list = milestonesByProject.get(milestone.project_id) ?? [];
    list.push(milestone);
    milestonesByProject.set(milestone.project_id, list);
  }

  const ledgerByProject = new Map();
  for (const entry of ledgerResult.rows) {
    const list = ledgerByProject.get(entry.project_id) ?? [];
    list.push(entry);
    ledgerByProject.set(entry.project_id, list);
  }

  const openDisputesByProject = new Map();
  for (const dispute of disputeResult.rows) {
    const list = openDisputesByProject.get(dispute.project_id) ?? [];
    list.push(dispute);
    openDisputesByProject.set(dispute.project_id, list);
  }

  const summaries = projects.map((project) => {
    const milestones = milestonesByProject.get(project.id) ?? [];
    const ledger = ledgerByProject.get(project.id) ?? [];
    const openDisputes = openDisputesByProject.get(project.id) ?? [];

    const money = summarizeLedger(ledger);

    const releasedCount = milestones.filter(
      (milestone) => milestone.status === 'RELEASED',
    ).length;

    const submittedCount = milestones.filter(
      (milestone) => milestone.status === 'SUBMITTED',
    ).length;

    const pendingCount = milestones.filter(
      (milestone) => milestone.status === 'PENDING' || milestone.status === 'REJECTED',
    ).length;

    const viewerRole = project.client_id === userId ? 'CLIENT' : 'CONTRACTOR';

    const actionNeeded =
      project.status === 'ACTIVE' &&
      (viewerRole === 'CLIENT'
        ? submittedCount > 0
        : money.funded && pendingCount > 0);

    return {
      id: project.id,
      title: project.title,
      status: project.status,
      total_paise: project.total_paise,
      deposited_paise: money.deposited,
      released_paise: money.released,
      held_paise: money.held,
      funded: money.funded,
      milestone_count: milestones.length,
      released_count: releasedCount,
      submitted_count: submittedCount,
      pending_count: pendingCount,
      open_dispute_count: openDisputes.length,
      client_name: project.client_name,
      contractor_name: project.contractor_name,
      // The other party, ready to display without more logic in React.
      counterparty_name:
        viewerRole === 'CLIENT' ? project.contractor_name : project.client_name,
      viewer_role: viewerRole,
      action_needed: actionNeeded,
      created_at: project.created_at,
    };
  });

  res.json({ projects: summaries });
});

router.post('/', requireRole('CLIENT'), async (req, res) => {
  const title = text(req.body?.title, 'Title', { min: 3, max: 120 });

  const description = text(req.body?.description ?? '', 'Description', {
    min: 0,
    max: 1000,
  });

  const rawMilestones = req.body?.milestones;

  assert(Array.isArray(rawMilestones), 400, 'Milestones must be a list.');

  assert(
    rawMilestones.length >= 2 && rawMilestones.length <= 5,
    400,
    'A project must have between 2 and 5 milestones.',
  );

  const milestones = rawMilestones.map((item, index) => {
    const position = index + 1;

    return {
      position,
      title: text(item?.title, `Milestone ${position} title`, {
        min: 3,
        max: 120,
      }),
      amountPaise: positiveInteger(
        item?.amount_paise,
        `Milestone ${position} amount`,
      ),
    };
  });

  const totalPaise = milestones.reduce(
    (sum, milestone) => sum + milestone.amountPaise,
    0,
  );

  assert(
    totalPaise <= 2_147_483_647,
    400,
    'The project total is too large for this demo.',
  );

  const projectId = await withTransaction(async (client) => {
    const projectResult = await client.query(
      `INSERT INTO projects (client_id, title, description, total_paise, status)
       VALUES ($1, $2, $3, $4, 'OPEN')
       RETURNING id`,
      [req.user.id, title, description, totalPaise],
    );

    const newProjectId = projectResult.rows[0].id;

    for (const milestone of milestones) {
      await client.query(
        `INSERT INTO milestones (project_id, position, title, amount_paise, status)
         VALUES ($1, $2, $3, $4, 'PENDING')`,
        [
          newProjectId,
          milestone.position,
          milestone.title,
          milestone.amountPaise,
        ],
      );
    }

    await client.query(
      `INSERT INTO events (project_id, actor_id, kind, message)
       VALUES ($1, $2, 'PROJECT_CREATED', $3)`,
      [
        newProjectId,
        req.user.id,
        `${req.user.name} created "${title}" with ${milestones.length} milestones.`,
      ],
    );

    return newProjectId;
  });

  res.status(201).json({ id: projectId });
});


router.get('/:id', async (req, res) => {
  const projectId = parseId(req.params.id, 'Project id');
  const project = await getProjectForUser(projectId, req.user.id);

  // These five queries are independent, so run them in parallel.
  const [milestoneResult, proofResult, ledgerResult, eventResult, disputeResult] =
    await Promise.all([
      query(
        `SELECT id, project_id, position, title, amount_paise, status, created_at
         FROM milestones
         WHERE project_id = $1
         ORDER BY position`,
        [projectId],
      ),
      query(
        `SELECT
           pr.*,
           u.name AS submitted_by_name,
           r.name AS reviewed_by_name
         FROM proofs pr
         JOIN milestones m ON m.id = pr.milestone_id
         JOIN users u ON u.id = pr.submitted_by
         LEFT JOIN users r ON r.id = pr.reviewed_by
         WHERE m.project_id = $1
         ORDER BY pr.created_at DESC, pr.id DESC`,
        [projectId],
      ),
      query(
        `SELECT
           l.*,
           m.title AS milestone_title
         FROM ledger_entries l
         LEFT JOIN milestones m ON m.id = l.milestone_id
         WHERE l.project_id = $1
         ORDER BY l.created_at ASC, l.id ASC`,
        [projectId],
      ),
      query(
        `SELECT
           e.*,
           u.name AS actor_name
         FROM events e
         JOIN users u ON u.id = e.actor_id
         WHERE e.project_id = $1
         ORDER BY e.created_at ASC, e.id ASC`,
        [projectId],
      ),
      query(
        `SELECT
           d.*,
           u.name AS raised_by_name,
           m.title AS milestone_title
         FROM disputes d
         JOIN users u ON u.id = d.raised_by
         JOIN milestones m ON m.id = d.milestone_id
         WHERE d.project_id = $1
         ORDER BY d.created_at DESC, d.id DESC`,
        [projectId],
      ),
    ]);

  const proofsByMilestone = new Map();
  for (const proof of proofResult.rows) {
    const list = proofsByMilestone.get(proof.milestone_id) ?? [];
    list.push(proof);
    proofsByMilestone.set(proof.milestone_id, list);
  }

  const milestones = milestoneResult.rows.map((milestone) => {
    const proofs = proofsByMilestone.get(milestone.id) ?? [];

    return {
      ...milestone,
      proofs,
      latest_proof: proofs[0] ?? null,
    };
  });

  const ledger = ledgerResult.rows;
  const money = summarizeLedger(ledger);

  res.json({
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      total_paise: project.total_paise,
      created_at: project.created_at,
      client: { id: project.client_id, name: project.client_name },
      contractor: project.contractor_id
        ? { id: project.contractor_id, name: project.contractor_name }
        : null,
      funded: money.funded,
      deposited_paise: money.deposited,
      released_paise: money.released,
      held_paise: money.held,
      viewer_role: project.viewer_role,
    },
    milestones,
    ledger,
    events: eventResult.rows,
    disputes: disputeResult.rows,
  });
});

router.post('/:id/accept', requireRole('CONTRACTOR'), async (req, res) => {
  const projectId = parseId(req.params.id, 'Project id');

  await getProjectById(projectId);

  const result = await withTransaction(async (client) => {
    const updated = await client.query(
      `UPDATE projects
       SET contractor_id = $1, status = 'ACTIVE'
       WHERE id = $2
         AND status = 'OPEN'
         AND contractor_id IS NULL
         AND client_id <> $1
       RETURNING id`,
      [req.user.id, projectId],
    );

    if (updated.rowCount === 0) {
      throw new HttpError(
        409,
        'This project is no longer open, or you cannot accept it.',
      );
    }

    await client.query(
      `INSERT INTO events (project_id, actor_id, kind, message)
       VALUES ($1, $2, 'CONTRACTOR_ACCEPTED', $3)`,
      [projectId, req.user.id, `${req.user.name} accepted the project.`],
    );

    return updated.rows[0];
  });

  res.json({ id: result.id });
});


router.post('/:id/fund', requireRole('CLIENT'), async (req, res) => {
  const projectId = parseId(req.params.id, 'Project id');
  const project = await getProjectForUser(projectId, req.user.id);

  requireClient(project, req.user.id);
  assertProjectActive(project);

  assert(
    project.contractor_id !== null,
    409,
    'A contractor must accept the project before it can be funded.',
  );

  assert(
    !project.funded,
    409,
    'This project has already been funded.',
  );

  await withTransaction(async (client) => {

    const locked = await client.query(
      'SELECT id, status FROM projects WHERE id = $1 FOR UPDATE',
      [projectId],
    );

    assert(locked.rowCount === 1, 404, 'Project not found.');
    assert(
      locked.rows[0].status === 'ACTIVE',
      409,
      'This project cannot be funded right now.',
    );

    const existingDeposit = await client.query(
      `SELECT 1 FROM ledger_entries
       WHERE project_id = $1 AND kind = 'DEPOSIT'`,
      [projectId],
    );

    assert(
      existingDeposit.rowCount === 0,
      409,
      'This project has already been funded.',
    );

    await client.query(
      `INSERT INTO ledger_entries
         (project_id, milestone_id, kind, amount_paise, note)
       VALUES ($1, NULL, 'DEPOSIT', $2, 'Demo escrow deposit')`,
      [projectId, project.total_paise],
    );

    const readableTotal = (project.total_paise / 100).toLocaleString('en-IN');

    await client.query(
      `INSERT INTO events (project_id, actor_id, kind, message)
       VALUES ($1, $2, 'PROJECT_FUNDED', $3)`,
      [
        projectId,
        req.user.id,
        `${req.user.name} deposited ₹${readableTotal} into demo escrow.`,
      ],
    );
  });

  res.json({ message: 'Demo escrow funded.' });
});

export default router;