import { ApiEnvelope, PaginationMeta } from '../models';

export const unwrapData = <T>(response: ApiEnvelope<T> | T): T => {
  if (isEnvelope(response) && response.data !== undefined) {
    return response.data;
  }

  return response as T;
};

export const unwrapList = <T>(response: ApiEnvelope<T[]> | T[] | { data?: { items?: T[]; docs?: T[] }; items?: T[]; docs?: T[] }): T[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (isEnvelope<T[]>(response) && Array.isArray(response.data)) {
    return response.data;
  }

  const nested = response.data;
  if (nested && typeof nested === 'object') {
    const dataRecord = nested as { items?: T[]; docs?: T[] };
    return dataRecord.items ?? dataRecord.docs ?? [];
  }

  const record = response as { items?: T[]; docs?: T[] };
  return record.items ?? record.docs ?? [];
};

export const getPagination = <T>(response: ApiEnvelope<T>): PaginationMeta | null => response.pagination ?? null;

export const isEnvelope = <T>(value: unknown): value is ApiEnvelope<T> =>
  typeof value === 'object' && value !== null && ('data' in value || 'success' in value || 'message' in value);

export const getErrorMessage = (error: unknown): string => {
  if (typeof error !== 'object' || error === null) {
    return 'Unexpected error';
  }

  const maybeError = error as { error?: { message?: string }; message?: string };
  return maybeError.error?.message ?? maybeError.message ?? 'Unexpected error';
};
