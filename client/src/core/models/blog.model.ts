import { EntityId, UploadAsset } from './api.model';
import { Company } from './company.model';
import { User } from './user.model';

export interface Blog {
  _id: EntityId;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived' | string;
  author?: EntityId | User;
  companyId?: EntityId | Company;
  coverImage?: UploadAsset | string;
  likesCount?: number;
  commentsCount?: number;
  bookmarksCount?: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  readonly [key: string]: unknown;
}

export interface BlogComment {
  _id: EntityId;
  blogId: EntityId;
  userId: EntityId | User;
  text: string;
  createdAt?: string;
  readonly [key: string]: unknown;
}
