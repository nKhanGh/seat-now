import { Link } from 'react-router-dom';
import { useCheckInSummary } from '../../community/api/checkInQueries';
import { useReviews } from '../../community/api/reviewsQueries';
import { activitySignalLabels } from '../../community/services/activitySignal';

export function BusinessCommunityPanel({ slug, name }: { slug: string; name: string }) {
  const checkIns = useCheckInSummary(slug);
  const reviews = useReviews(slug);
  const recentReviews = reviews.data?.pages.flatMap((page) => page.data).slice(0, 5) ?? [];

  return (
    <section className="card business-community" aria-label={`Tương tác khách hàng của ${name}`}>
      <div className="business-community-heading">
        <div>
          <p className="eyebrow">Gói cơ bản</p>
          <h3>Tương tác khách hàng</h3>
        </div>
        <button
          type="button"
          onClick={() => void Promise.all([checkIns.refetch(), reviews.refetch()])}
          disabled={checkIns.isFetching || reviews.isFetching}
        >
          {checkIns.isFetching || reviews.isFetching ? 'Đang cập nhật…' : 'Làm mới'}
        </button>
      </div>
      {checkIns.isPending && <p>Đang tải check-in…</p>}
      {checkIns.isError && <p role="alert">{checkIns.error.message}</p>}
      {checkIns.data && (
        <>
          <p>
            <strong>{checkIns.data.lastHourUsers}</strong> tài khoản check-in trong giờ qua.
          </p>
          <p className="community-activity">{activitySignalLabels[checkIns.data.activitySignal]}</p>
          <p className="small">Tín hiệu tự báo cáo; không phải số khách hoặc bàn đang được sử dụng.</p>
        </>
      )}
      <h4>Đánh giá và ảnh gần đây</h4>
      {reviews.isPending && <p>Đang tải đánh giá…</p>}
      {reviews.isError && <p role="alert">{reviews.error.message}</p>}
      {!reviews.isPending && !reviews.isError && recentReviews.length === 0 && (
        <p>Quán chưa có đánh giá công khai.</p>
      )}
      <div className="business-review-list">
        {recentReviews.map((review) => (
          <article className="business-review" key={review.id}>
            <div className="business-review-heading">
              <strong>
                {review.author.displayName} · {review.rating}/5 sao
              </strong>
              <time dateTime={review.createdAt}>
                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </time>
            </div>
            <p>{review.body || 'Chỉ chấm sao, không có nhận xét.'}</p>
            {review.photoUrl && (
              <img
                src={review.photoUrl}
                alt={`Ảnh đánh giá của ${review.author.displayName}`}
                loading="lazy"
              />
            )}
          </article>
        ))}
      </div>
      <Link to={`/?venue=${encodeURIComponent(slug)}`}>Xem trang quán và tất cả đánh giá</Link>
    </section>
  );
}
