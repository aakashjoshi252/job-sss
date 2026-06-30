import { EntityId } from './api.model';

export interface Resume {
  _id: EntityId;
  candidateId?: EntityId;
  userId?: EntityId;
  title?: string;
  summary?: string;
  skills?: string[];
  education?: readonly ResumeSection[];
  experience?: readonly ResumeSection[];
  projects?: readonly ResumeSection[];
  fileUrl?: string;
  template?: string;
  createdAt?: string;
  updatedAt?: string;
  readonly [key: string]: unknown;
}

export interface ResumeSection {
  title?: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}
