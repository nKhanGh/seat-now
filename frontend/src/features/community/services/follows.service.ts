export type PublicProfile = { id: string; displayName: string; followers: number };
export type FollowedProfile = { id: string; displayName: string; followedAt: string };

export async function getPublicProfile(id: string, signal?: AbortSignal): Promise<PublicProfile> {
  const response = await fetch(`/api/v1/users/${encodeURIComponent(id)}`, { signal });
  if (!response.ok) throw new Error(`Không tải được hồ sơ (${response.status}).`);
  const body = (await response.json()) as { data: PublicProfile };
  return body.data;
}

export async function getFollowingStatus(id: string, signal?: AbortSignal): Promise<boolean> {
  const response = await fetch(`/api/v1/me/follows/${encodeURIComponent(id)}`, {
    signal,
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Không tải được trạng thái theo dõi (${response.status}).`);
  const body = (await response.json()) as { data: { following: boolean } };
  return body.data.following;
}

export async function getFollowingList(
  signal?: AbortSignal,
): Promise<{ data: FollowedProfile[]; meta: { truncated: boolean } }> {
  const response = await fetch('/api/v1/me/follows', { signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Không tải được danh sách theo dõi (${response.status}).`);
  return response.json() as Promise<{ data: FollowedProfile[]; meta: { truncated: boolean } }>;
}

export async function setFollow(id: string, following: boolean): Promise<void> {
  const response = await fetch(`/api/v1/me/follows/${encodeURIComponent(id)}`, {
    method: following ? 'PUT' : 'DELETE',
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Không cập nhật được theo dõi (${response.status}).`);
}
