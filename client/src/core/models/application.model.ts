import { EntityId } from './api.model';
import { Job } from './job.model';
import { User } from './user.model';

export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected' | 'Withdrawn' | string;

export interface Application {
  _id: EntityId;
  candidateId: EntityId | User;
  recruiterId?: EntityId | User;
  jobId: EntityId | Job;
  status: ApplicationStatus;
  resumeId?: EntityId;
  coverLetter?: string;
  timeline?: readonly ApplicationTimelineItem[];
  createdAt?: string;
  updatedAt?: string;
  readonly [key: string]: unknown;
}

export interface ApplicationTimelineItem {
  status: ApplicationStatus;
  note?: string;
  createdAt: string;
}
