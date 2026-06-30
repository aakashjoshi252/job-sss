import { EntityId, UploadAsset, UserRole } from './api.model';

export interface User {
  _id: EntityId;
  username: string;
  email: string;
  role: UserRole;
  phone?: string;
  isEmailVerified?: boolean;
  accountStatus?: 'Active' | 'Blocked' | 'Pending';
  jobProfession?: string;
  profilePicture?: string;
  profileImage?: UploadAsset;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
  readonly [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: Exclude<UserRole, 'admin'>;
  phone: string;
  jobProfession?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface VerificationPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
}
