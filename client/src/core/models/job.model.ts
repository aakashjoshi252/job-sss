import { EntityId } from './api.model';
import { Company } from './company.model';

export interface Job {
  _id: EntityId;
  title: string;
  description?: string;
  jobDescription?: string;
  companyId?: EntityId | Company;
  recruiterId?: EntityId;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  salary?: string;
  profession?: string;
  skills?: string[];
  status?: string;
  visibility?: string;
  applicationDeadline?: string;
  createdAt?: string;
  updatedAt?: string;
  readonly [key: string]: unknown;
}

export interface SavedJob {
  _id: EntityId;
  jobId: EntityId | Job;
  candidateId: EntityId;
  notes?: string;
  createdAt?: string;
  readonly [key: string]: unknown;
}
