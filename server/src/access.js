import { query } from './db.js';
import { assert, HttpError } from './http.js';

export async function getProjectForUser(projectId, userId) {
  const result = await query(
    `SELECT
       p.*,
       c.name AS client_name,
       k.name AS contractor_name,
       EXISTS (
         SELECT 1
         FROM ledger_entries l
         WHERE l.project_id = p.id AND l.kind = 'DEPOSIT'
       ) AS funded
     FROM projects p
     JOIN users c ON c.id = p.client_id
     LEFT JOIN users k ON k.id = p.contractor_id
     WHERE p.id = $1
       AND (p.client_id = $2 OR p.contractor_id = $2)`,
    [projectId, userId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Project not found.');
  }

  const project = result.rows[0];

  project.viewer_role = project.client_id === userId ? 'CLIENT' : 'CONTRACTOR';

  return project;
}

export async function getProjectById(projectId) {
  const result = await query(
    `SELECT
       p.*,
       c.name AS client_name,
       k.name AS contractor_name,
       EXISTS (
         SELECT 1
         FROM ledger_entries l
         WHERE l.project_id = p.id AND l.kind = 'DEPOSIT'
       ) AS funded
     FROM projects p
     JOIN users c ON c.id = p.client_id
     LEFT JOIN users k ON k.id = p.contractor_id
     WHERE p.id = $1`,
    [projectId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Project not found.');
  }

  return result.rows[0];
}

export function requireClient(project, userId) {
  assert(
    project.client_id === userId,
    403,
    'Only the client who owns this project can do that.',
  );
}

export function requireContractor(project, userId) {
  assert(
    project.contractor_id === userId,
    403,
    'Only the contractor assigned to this project can do that.',
  );
}

export function assertProjectActive(project) {
  assert(
    project.status === 'ACTIVE',
    409,
    `This project is ${project.status.toLowerCase()} and cannot be changed right now.`,
  );
}

export function assertFunded(project) {
  assert(
    project.funded,
    409,
    'The client must fund this project before work can be submitted or reviewed.',
  );
}

export async function loadMilestone(projectId, milestoneId) {
  const result = await query(
    'SELECT * FROM milestones WHERE id = $1 AND project_id = $2',
    [milestoneId, projectId],
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, 'Milestone not found in this project.');
  }

  return result.rows[0];
}