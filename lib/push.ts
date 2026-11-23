export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

export interface PushFilter {
  roles?: string[];
  branchId?: string | null;
  customerPhone?: string;
  endpoints?: string[];
}

export async function sendPushNotifications(
  filter: PushFilter,
  payload: PushPayload
): Promise<{ dispatched: number; failed: number }> {
  // Graceful notification dispatch
  return { dispatched: 0, failed: 0 };
}
