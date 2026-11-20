import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReviews,
  getUserReviews,
  removeReview,
  reportReview,
  saveReview,
  uploadReviewPhoto,
} from '../services/reviews.service';

const reviewsKey = (slug: string) => ['community', 'reviews', slug] as const;
const userReviewsKey = (id: string) => ['community', 'user-reviews', id] as const;

export function useReviews(slug: string) {
  return useInfiniteQuery({
    queryKey: reviewsKey(slug),
    queryFn: ({ pageParam, signal }) => getReviews(slug, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
  });
}
export function useUserReviews(id: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: userReviewsKey(id),
    queryFn: ({ pageParam, signal }) => getUserReviews(id, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    enabled,
  });
}

export function useSaveReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, rating, body }: { slug: string; rating: number; body: string }) =>
      saveReview(slug, { rating, body }),
    onSuccess: (_, { slug }) =>
      Promise.all([
        client.invalidateQueries({ queryKey: reviewsKey(slug) }),
        client.invalidateQueries({ queryKey: ['community', 'user-reviews'] }),
        client.invalidateQueries({ queryKey: ['map', 'nearby'] }),
        client.invalidateQueries({ queryKey: ['map', 'hcm-pins'] }),
        client.invalidateQueries({ queryKey: ['venues', 'detail', slug] }),
      ]),
  });
}

export function useRemoveReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => removeReview(slug),
    onSuccess: (_, slug) =>
      Promise.all([
        client.invalidateQueries({ queryKey: reviewsKey(slug) }),
        client.invalidateQueries({ queryKey: ['community', 'user-reviews'] }),
        client.invalidateQueries({ queryKey: ['map', 'nearby'] }),
        client.invalidateQueries({ queryKey: ['map', 'hcm-pins'] }),
        client.invalidateQueries({ queryKey: ['venues', 'detail', slug] }),
      ]),
  });
}

export function useUploadReviewPhoto() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, file }: { slug: string; file: File }) => uploadReviewPhoto(slug, file),
    onSuccess: (_, { slug }) =>
      Promise.all([
        client.invalidateQueries({ queryKey: reviewsKey(slug) }),
        client.invalidateQueries({ queryKey: ['community', 'user-reviews'] }),
      ]),
  });
}

export function useReportReview() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: 'SPAM' | 'ABUSE' | 'OTHER' }) =>
      reportReview(id, reason),
  });
}
