export interface DashboardStats {
  users?: number;
  candidates?: number;
  recruiters?: number;
  companies?: number;
  jobs?: number;
  applications?: number;
  subscriptions?: number;
  revenue?: number;
  readonly [key: string]: unknown;
}
