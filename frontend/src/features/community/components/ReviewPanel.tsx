import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRemoveReview, useReportReview, useReviews, useSaveReview, useUploadReviewPhoto } from '../api/reviewsQueries';

export function ReviewPanel({ slug, userId }: { slug: string; userId: string | null }) {
  const reviews = useReviews(slug);
  const save = useSaveReview();
  const remove = useRemoveReview();
  const upload = useUploadReviewPhoto();
  const report = useReportReview();
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const items = reviews.data?.pages.flatMap((page) => page.data) ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await save.mutateAsync({ slug, rating, body: body.trim() });
      if (file) await upload.mutateAsync({ slug, file });
      setBody(''); setFile(null); form.reset();
    }
    catch { /* Mutation error is rendered below. */ }
  }

  return <section className="review-panel" aria-label="Review địa điểm">
    <h2>Review cộng đồng</h2>
    {userId ? <form onSubmit={(event) => void submit(event)}>
      <label>Đánh giá <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
        {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sao</option>)}
      </select></label>
      <label>Nhận xét ngắn <textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={10} maxLength={500} required /></label>
      <label>Ảnh thực tế (JPEG, PNG, WebP; tối đa 2 MB)
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
          const next = event.target.files?.[0] ?? null;
          setFileError(next && next.size > 2_000_000 ? 'Ảnh vượt quá 2 MB.' : '');
          setFile(next);
        }} />
      </label>
      <button disabled={save.isPending || upload.isPending || Boolean(fileError) || body.trim().length < 10}>{save.isPending || upload.isPending ? 'Đang lưu…' : 'Đăng review'}</button>
      {save.isError && <p role="alert">{save.error.message}</p>}
      {upload.isError && <p role="alert">Review đã lưu nhưng ảnh chưa tải lên: {upload.error.message}</p>}
      {fileError && <p role="alert">{fileError}</p>}
    </form> : <p><Link to="/login">Đăng nhập</Link> để viết review.</p>}
    {reviews.isPending && <p>Đang tải review…</p>}
    {reviews.isError && <p role="alert">{reviews.error.message} <button onClick={() => void reviews.refetch()}>Thử lại</button></p>}
    {reviews.data && items.length === 0 && <p>Chưa có review nào.</p>}
    {items.map((review) => <article key={review.id} className="review-card">
      <Link to={`/users/${review.author.id}`}>{review.author.displayName}</Link><span> · {'★'.repeat(review.rating)}</span>
      <p>{review.body}</p>
      {review.photoUrl && <img className="review-photo" src={review.photoUrl} alt={`Ảnh review của ${review.author.displayName}`} loading="lazy" />}
      <small>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</small>
      {userId === review.author.id && <button onClick={() => remove.mutate(slug)} disabled={remove.isPending}>Xóa review của tôi</button>}
      {userId && userId !== review.author.id && <button disabled={report.isPending || reportedIds.includes(review.id)}
        onClick={() => report.mutate({ id: review.id, reason: 'OTHER' }, { onSuccess: () => setReportedIds((ids) => [...ids, review.id]) })}>
        {reportedIds.includes(review.id) ? 'Đã báo cáo' : 'Báo cáo review'}
      </button>}
    </article>)}
    {remove.isError && <p role="alert">{remove.error.message}</p>}
    {report.isError && <p role="alert">{report.error.message}</p>}
    {reviews.hasNextPage && <button onClick={() => void reviews.fetchNextPage()} disabled={reviews.isFetchingNextPage}>{reviews.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm review'}</button>}
  </section>;
}
