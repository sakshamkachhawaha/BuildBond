import { HttpError } from './http.js';

export function requireProjectMember(project, user) {
  if (!project || (project.client_id !== user.id && project.contractor_id !== user.id)) {
    throw new HttpError(404, 'Project not found');
  }
  return project;
}

