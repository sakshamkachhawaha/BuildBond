import { Router } from 'express';
import {
  assertProjectActive,
  getProjectForUser,
  loadMilestone,
} from '../access.js';
import { requireAuth } from '../auth.js';
import { query, withTransaction } from '../db.js';
import { assert, HttpError, parseId } from '../http.js';
import { text } from '../validate.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/', async (req, res) => {
  const projectId = parseId(req.params.projectId, 'Project id');

  const project = await getProjectForUser(projectId, req.user.id);
  assertProjectActive(project);

  const milestoneId = parseId(req.body?.milestone_id, 'Milestone id');

  const reason = text(req.body?.reason, 'Dispute reason', {
    min: 10,
    max: 1000,
  });

  const milestone = await loadMilestone(projectId, milestoneId);

  assert(
    milestone.status !== 'RELEASED',
    409,
    'A milestone that has already been paid cannot be disputed.',
  );

  const disputeId = await withTransaction(async (client) => {

    const lockedProject = await client.query(
      'SELECT id, status FROM projects WHERE id = $1 FOR UPDATE',
      [projectId],
    );

    assert(lockedProject.rowCount === 1, 404, 'Project not found.');

    assert(
      lockedProject.rows[0].status === 'ACTIVE',
      409,
      'This project cannot be disputed right now.',
    );

    let inserted;

    try {
      inserted = await client.query(
        `INSERT INTO disputes (project_id, milestone_id, raised_by, reason)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [projectId, milestoneId, req.user.id, reason],
      );
    } catch (error) {
      if (error.code === '23505') {
        throw new HttpError(
          409,
          'There is already an open dispute for this milestone.',
        );
      }

      throw error;
    }

    await client.query(
      `UPDATE projects SET status = 'DISPUTED' WHERE id = $1`,
      [projectId],
    );

    await client.query(
      `INSERT INTO events (project_id, actor_id, kind, message)
       VALUES ($1, $2, 'DISPUTE_RAISED', $3)`,
      [
        projectId,
        req.user.id,
        `${req.user.name} raised a dispute on "${milestone.title}": ${reason}`,
      ],
    );

    return inserted.rows[0].id;
  });

  res.status(201).json({
    id: disputeId,
    message: 'Dispute raised. The project is frozen.',
  });
});

router.post('/:disputeId/withdraw', async (req, res) => {
  const projectId = parseId(req.params.projectId, 'Project id');
  const disputeId = parseId(req.params.disputeId, 'Dispute id');

  await getProjectForUser(projectId, req.user.id);

  const disputeResult = await query(
    'SELECT * FROM disputes WHERE id = $1 AND project_id = $2',
    [disputeId, projectId],
  );

  if (disputeResult.rowCount === 0) {
    throw new HttpError(404, 'Dispute not found.');
  }

  const dispute = disputeResult.rows[0];

  assert(
    dispute.status === 'OPEN',
    409,
    'This dispute is already closed.',
  );

  assert(
    dispute.raised_by === req.user.id,
    403,
    'Only the person who raised the dispute can withdraw it.',
  );

  await withTransaction(async (client) => {
    const lockedProject = await client.query(
      'SELECT id, status FROM projects WHERE id = $1 FOR UPDATE',
      [projectId],
    );

    assert(lockedProject.rowCount === 1, 404, 'Project not found.');

    const updatedDispute = await client.query(
      `UPDATE disputes
       SET status = 'WITHDRAWN', resolved_at = now()
       WHERE id = $1 AND status = 'OPEN'
       RETURNING id`,
      [disputeId],
    );

    assert(
      updatedDispute.rowCount === 1,
      409,
      'This dispute is already closed.',
    );

    const otherOpenResult = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM disputes
       WHERE project_id = $1 AND status = 'OPEN'`,
      [projectId],
    );

    if (
      otherOpenResult.rows[0].count === 0 &&
      lockedProject.rows[0].status === 'DISPUTED'
    ) {
      await client.query(
        `UPDATE projects SET status = 'ACTIVE' WHERE id = $1`,
        [projectId],
      );
    }

    await client.query(
      `INSERT INTO events (project_id, actor_id, kind, message)
       VALUES ($1, $2, 'DISPUTE_WITHDRAWN', $3)`,
      [
        projectId,
        req.user.id,
        `${req.user.name} withdrew the dispute. The project is active again.`,
      ],
    );
  });

  res.json({ message: 'Dispute withdrawn.' });
});

export default router;
