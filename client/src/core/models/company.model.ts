import { EntityId, UploadAsset } from './api.model';

export interface Company {
  _id: EntityId;
  companyName: string;
  recruiterId?: EntityId;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  uploadLogo?: UploadAsset | string;
  logo?: string;
  cloudinaryPublicId?: string;
  verified?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  readonly [key: string]: unknown;
}
