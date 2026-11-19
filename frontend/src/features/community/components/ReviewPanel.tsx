import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRemoveReview, useReviews, useSaveReview } from '../api/reviewsQueries';

export function ReviewPanel({ slug, userId }: { slug: string; userId: string | null }) {
  const reviews = useReviews(slug);
  const save = useSaveReview();
  const remove = useRemoveReview();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const items = reviews.data?.pages.flatMap((page) => page.data) ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await save.mutateAsync({ slug, rating, body: body.trim() }); setBody(''); }
    catch { /* Mutation error is rendered below. */ }
  }

  return <section className="review-panel" aria-label="Review địa điểm">
    <h2>Review cộng đồng</h2>
    {userId ? <form onSubmit={(event) => void submit(event)}>
      <label>Đánh giá <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
        {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sao</option>)}
      </select></label>
      <label>Nhận xét ngắn <textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={10} maxLength={500} required /></label>
      <button disabled={save.isPending || body.trim().length < 10}>{save.isPending ? 'Đang lưu…' : 'Đăng review'}</button>
      {save.isError && <p role="alert">{save.error.message}</p>}
    </form> : <p><Link to="/login">Đăng nhập</Link> để viết review.</p>}
    {reviews.isPending && <p>Đang tải review…</p>}
    {reviews.isError && <p role="alert">{reviews.error.message} <button onClick={() => reviews.refetch()}>Thử lại</button></p>}
    {reviews.data && items.length === 0 && <p>Chưa có review nào.</p>}
    {items.map((review) => <article key={review.id} className="review-card">
      <strong>{review.author.displayName}</strong><span> · {'★'.repeat(review.rating)}</span>
      <p>{review.body}</p>
      <small>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</small>
      {userId === review.author.id && <button onClick={() => remove.mutate(slug)} disabled={remove.isPending}>Xóa review của tôi</button>}
    </article>)}
    {remove.isError && <p role="alert">{remove.error.message}</p>}
    {reviews.hasNextPage && <button onClick={() => void reviews.fetchNextPage()} disabled={reviews.isFetchingNextPage}>{reviews.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm review'}</button>}
  </section>;
}
