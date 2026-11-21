export type CheckInSummary = {
  lastHourUsers: number;
  latestAt: string | null;
  source: 'SELF_REPORTED';
  activitySignal: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
};

export async function getCheckInSummary(slug: string, signal?: AbortSignal): Promise<CheckInSummary> {
  const response = await fetch(`/api/v1/venues/${encodeURIComponent(slug)}/check-ins`, { signal });
  if (!response.ok) throw new Error(`Không tải được check-in (${response.status}).`);
  const body = (await response.json()) as { data: CheckInSummary };
  return body.data;
}

export async function createCheckIn(
  slug: string,
  position: { lat: number; lng: number; accuracyM: number },
): Promise<void> {
  const response = await fetch(`/api/v1/venues/${encodeURIComponent(slug)}/check-ins`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(position),
  });
  if (!response.ok) {
    if (response.status === 403) throw new Error('Bạn cần ở gần địa điểm để check-in.');
    if (response.status === 400) throw new Error('Vị trí chưa đủ chính xác. Hãy thử lại khi GPS ổn định.');
    throw new Error(`Không thể check-in (${response.status}).`);
  }
}
