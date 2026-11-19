import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFollowingList, getFollowingStatus, getPublicProfile, setFollow } from '../services/follows.service';

const profileKey = (id: string) => ['community', 'profile', id] as const;
const statusKey = (userId: string | null, id: string) => ['community', 'follow-status', userId, id] as const;
const listKey = (userId: string | null) => ['community', 'following', userId] as const;

export function usePublicProfile(id: string) {
  return useQuery({ queryKey: profileKey(id), queryFn: ({ signal }) => getPublicProfile(id, signal), enabled: Boolean(id) });
}

export function useFollowingStatus(userId: string | null, id: string) {
  return useQuery({ queryKey: statusKey(userId, id), queryFn: ({ signal }) => getFollowingStatus(id, signal), enabled: Boolean(userId && id && userId !== id) });
}

export function useFollowingList(userId: string | null) {
  return useQuery({ queryKey: listKey(userId), queryFn: ({ signal }) => getFollowingList(signal), enabled: Boolean(userId) });
}

export function useSetFollow() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, following }: { id: string; following: boolean }) => setFollow(id, following),
    onSuccess: (_, { id }) => {
      void client.invalidateQueries({ queryKey: ['community', 'follow-status'] });
      void client.invalidateQueries({ queryKey: ['community', 'following'] });
      void client.invalidateQueries({ queryKey: profileKey(id) });
    } });
}
