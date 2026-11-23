import { Router } from 'express';
import {
  assertFunded,
  assertProjectActive,
  getProjectForUser,
  loadMilestone,
  requireClient,
  requireContractor,
} from '../access.js';
import { requireAuth, requireRole } from '../auth.js';
import { withTransaction } from '../db.js';
import { assertMilestoneTransition } from '../domain.js';
import { assert, HttpError, parseId } from '../http.js';
import { httpUrl, text } from '../validate.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post(
  '/:milestoneId/proofs',
  requireRole('CONTRACTOR'),
  async (req, res) => {
    const projectId = parseId(req.params.projectId, 'Project id');
    const milestoneId = parseId(req.params.milestoneId, 'Milestone id');

    const project = await getProjectForUser(projectId, req.user.id);

    requireContractor(project, req.user.id);
    assertProjectActive(project);
    assertFunded(project);

    const milestone = await loadMilestone(projectId, milestoneId);

    assertMilestoneTransition(milestone.status, 'SUBMITTED');

    const url = httpUrl(req.body?.url);
    const note = text(req.body?.note ?? '', 'Proof note', {
      min: 0,
      max: 1000,
    });

    await withTransaction(async (client) => {

      const lockedProject = await client.query(
        'SELECT id, status FROM projects WHERE id = $1 FOR UPDATE',
        [projectId],
      );

      assert(lockedProject.rowCount === 1, 404, 'Project not found.');
      assert(
        lockedProject.rows[0].status === 'ACTIVE',
        409,
        'This project is not active; proof cannot be submitted.',
      );

      const updated = await client.query(
        `UPDATE milestones
         SET status = 'SUBMITTED'
         WHERE id = $1 AND status = $2
         RETURNING id`,
        [milestoneId, milestone.status],
      );

      if (updated.rowCount === 0) {
        throw new HttpError(
          409,
          'This milestone changed while you were submitting. Refresh and try again.',
        );
      }

      await client.query(
        `INSERT INTO proofs (milestone_id, submitted_by, url, note, status)
         VALUES ($1, $2, $3, $4, 'SUBMITTED')`,
        [milestoneId, req.user.id, url, note],
      );

      await client.query(
        `INSERT INTO events (project_id, actor_id, kind, message)
         VALUES ($1, $2, 'PROOF_SUBMITTED', $3)`,
        [
          projectId,
          req.user.id,
          `${req.user.name} submitted proof for "${milestone.title}".`,
        ],
      );
    });

    res.status(201).json({ message: 'Proof submitted for review.' });
  },
);

router.post(
  '/:milestoneId/approve',
  requireRole('CLIENT'),
  async (req, res) => {
    const projectId = parseId(req.params.projectId, 'Project id');
    const milestoneId = parseId(req.params.milestoneId, 'Milestone id');

    const project = await getProjectForUser(projectId, req.user.id);

    requireClient(project, req.user.id);
    assertProjectActive(project);
    assertFunded(project);

    const milestone = await loadMilestone(projectId, milestoneId);
    assertMilestoneTransition(milestone.status, 'RELEASED');

    await withTransaction(async (client) => {
      const lockedProject = await client.query(
        'SELECT id, status FROM projects WHERE id = $1 FOR UPDATE',
        [projectId],
      );

      assert(lockedProject.rowCount === 1, 404, 'Project not found.');

      assert(
        lockedProject.rows[0].status === 'ACTIVE',
        409,
        'This project is not active; no money can be released.',
      );

      const lockedMilestone = await client.query(
        `SELECT id, title, amount_paise, status
         FROM milestones
         WHERE id = $1 AND project_id = $2
         FOR UPDATE`,
        [milestoneId, projectId],
      );

      assert(
        lockedMilestone.rowCount === 1,
        404,
        'Milestone not found in this project.',
      );

      const currentMilestone = lockedMilestone.rows[0];

      assert(
        currentMilestone.status === 'SUBMITTED',
        409,
        'This milestone is no longer waiting for approval.',
      );

      const balanceResult = await client.query(
        `SELECT
           COALESCE(SUM(CASE WHEN kind = 'DEPOSIT' THEN amount_paise ELSE 0 END), 0)::int AS deposited,
           COALESCE(SUM(CASE WHEN kind = 'RELEASE' THEN amount_paise ELSE 0 END), 0)::int AS released
         FROM ledger_entries
         WHERE project_id = $1`,
        [projectId],
      );

      const { deposited, released } = balanceResult.rows[0];

      assert(
        deposited - released >= currentMilestone.amount_paise,
        409,
        'The demo escrow does not hold enough money for this milestone.',
      );

      const updatedMilestone = await client.query(
        `UPDATE milestones
         SET status = 'RELEASED'
         WHERE id = $1 AND status = 'SUBMITTED'
         RETURNING id`,
        [milestoneId],
      );

      assert(
        updatedMilestone.rowCount === 1,
        409,
        'This milestone is no longer waiting for approval.',
      );

      const approvedProof = await client.query(
        `UPDATE proofs
         SET status = 'APPROVED',
             reviewed_by = $1,
             reviewed_at = now()
         WHERE id = (
           SELECT id
           FROM proofs
           WHERE milestone_id = $2 AND status = 'SUBMITTED'
           ORDER BY created_at DESC, id DESC
           LIMIT 1
         )
         RETURNING id`,
        [req.user.id, milestoneId],
      );

      assert(
        approvedProof.rowCount === 1,
        409,
        'There is no proof waiting for approval.',
      );

      await client.query(
        `INSERT INTO ledger_entries
           (project_id, milestone_id, kind, amount_paise, note)
         VALUES ($1, $2, 'RELEASE', $3, 'Released after proof approval')`,
        [projectId, milestoneId, currentMilestone.amount_paise],
      );

      await client.query(
        `INSERT INTO events (project_id, actor_id, kind, message)
         VALUES ($1, $2, 'MILESTONE_RELEASED', $3)`,
        [
          projectId,
          req.user.id,
          `${req.user.name} approved "${currentMilestone.title}" and released the milestone amount.`,
        ],
      );

      const remainingResult = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM milestones
         WHERE project_id = $1 AND status <> 'RELEASED'`,
        [projectId],
      );

      if (remainingResult.rows[0].count === 0) {
        await client.query(
          `UPDATE projects SET status = 'COMPLETED' WHERE id = $1`,
          [projectId],
        );

        await client.query(
          `INSERT INTO events (project_id, actor_id, kind, message)
           VALUES ($1, $2, 'PROJECT_COMPLETED', $3)`,
          [
            projectId,
            req.user.id,
            'All milestones are released. The project is complete.',
          ],
        );
      }
    });

    res.json({ message: 'Milestone approved and released.' });
  },
);


router.post(
  '/:milestoneId/reject',
  requireRole('CLIENT'),
  async (req, res) => {
    const projectId = parseId(req.params.projectId, 'Project id');
    const milestoneId = parseId(req.params.milestoneId, 'Milestone id');

    const project = await getProjectForUser(projectId, req.user.id);

    requireClient(project, req.user.id);
    assertProjectActive(project);
    assertFunded(project);

    const milestone = await loadMilestone(projectId, milestoneId);
    assertMilestoneTransition(milestone.status, 'REJECTED');

    const note = text(req.body?.note, 'Rejection note', {
      min: 5,
      max: 1000,
    });

    await withTransaction(async (client) => {

      const lockedProject = await client.query(
        'SELECT id, status FROM projects WHERE id = $1 FOR UPDATE',
        [projectId],
      );

      assert(lockedProject.rowCount === 1, 404, 'Project not found.');
      assert(
        lockedProject.rows[0].status === 'ACTIVE',
        409,
        'This project is not active; the proof cannot be reviewed.',
      );

      const lockedMilestone = await client.query(
        `SELECT id, title, status
         FROM milestones
         WHERE id = $1 AND project_id = $2
         FOR UPDATE`,
        [milestoneId, projectId],
      );

      assert(
        lockedMilestone.rowCount === 1,
        404,
        'Milestone not found in this project.',
      );

      assert(
        lockedMilestone.rows[0].status === 'SUBMITTED',
        409,
        'This milestone is no longer waiting for review.',
      );

      const rejectedProof = await client.query(
        `UPDATE proofs
         SET status = 'REJECTED',
             review_note = $1,
             reviewed_by = $2,
             reviewed_at = now()
         WHERE id = (
           SELECT id
           FROM proofs
           WHERE milestone_id = $3 AND status = 'SUBMITTED'
           ORDER BY created_at DESC, id DESC
           LIMIT 1
         )
         RETURNING id`,
        [note, req.user.id, milestoneId],
      );

      assert(
        rejectedProof.rowCount === 1,
        409,
        'There is no proof waiting for review.',
      );

      const updatedMilestone = await client.query(
        `UPDATE milestones
         SET status = 'REJECTED'
         WHERE id = $1 AND status = 'SUBMITTED'
         RETURNING id`,
        [milestoneId],
      );

      assert(
        updatedMilestone.rowCount === 1,
        409,
        'This milestone is no longer waiting for review.',
      );

      await client.query(
        `INSERT INTO events (project_id, actor_id, kind, message)
         VALUES ($1, $2, 'PROOF_REJECTED', $3)`,
        [
          projectId,
          req.user.id,
          `${req.user.name} rejected the proof for "${lockedMilestone.rows[0].title}". Reason: ${note}`,
        ],
      );
    });

    res.json({
      message: 'Proof rejected. The contractor can submit again.',
    });
  },
);

export default router;