export function ratingLabel(rating: number) {
  return Number.isFinite(rating) && rating > 0 ? `★ ${rating.toFixed(1)}` : 'Chưa có đánh giá';
}
