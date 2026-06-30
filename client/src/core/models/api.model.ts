export type EntityId = string;

export type UserRole = 'candidate' | 'recruiter' | 'admin';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type ApiParamValue = string | number | boolean | readonly (string | number | boolean)[] | null | undefined;
export type ApiParams = Record<string, ApiParamValue>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  code?: string;
  data?: T;
  user?: unknown;
  token?: string;
  pagination?: PaginationMeta;
  totalCount?: number;
  unreadCount?: number;
}

export interface UploadAsset {
  url: string;
  publicId?: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

export interface Identified {
  _id: EntityId;
}
