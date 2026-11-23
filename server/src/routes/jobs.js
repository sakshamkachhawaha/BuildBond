import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { query } from '../db.js';

const router = Router();

router.use(requireAuth, requireRole('CONTRACTOR'));

router.get('/', async (req, res) => {
  const result = await query(
    `SELECT
       p.id,
       p.title,
       p.description,
       p.total_paise,
       p.created_at,
       u.name AS client_name,
       COUNT(m.id)::int AS milestone_count
     FROM projects p
     JOIN users u ON u.id = p.client_id
     LEFT JOIN milestones m ON m.project_id = p.id
     WHERE p.status = 'OPEN' AND p.contractor_id IS NULL
     GROUP BY p.id, u.name
     ORDER BY p.created_at DESC, p.id DESC`,
  );

  res.json({ jobs: result.rows });
});

export default router;