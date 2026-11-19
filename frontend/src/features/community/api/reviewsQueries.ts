import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReviews, removeReview, reportReview, saveReview, uploadReviewPhoto } from '../services/reviews.service';

const reviewsKey = (slug: string) => ['community', 'reviews', slug] as const;

export function useReviews(slug: string) {
  return useInfiniteQuery({
    queryKey: reviewsKey(slug), queryFn: ({ pageParam, signal }) => getReviews(slug, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
  });
}

export function useSaveReview() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ slug, rating, body }: { slug: string; rating: number; body: string }) => saveReview(slug, { rating, body }),
    onSuccess: (_, { slug }) => client.invalidateQueries({ queryKey: reviewsKey(slug) }) });
}

export function useRemoveReview() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (slug: string) => removeReview(slug),
    onSuccess: (_, slug) => client.invalidateQueries({ queryKey: reviewsKey(slug) }) });
}

export function useUploadReviewPhoto() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ slug, file }: { slug: string; file: File }) => uploadReviewPhoto(slug, file),
    onSuccess: (_, { slug }) => client.invalidateQueries({ queryKey: reviewsKey(slug) }) });
}

export function useReportReview() {
  return useMutation({ mutationFn: ({ id, reason }: { id: string; reason: 'SPAM' | 'ABUSE' | 'OTHER' }) => reportReview(id, reason) });
}
