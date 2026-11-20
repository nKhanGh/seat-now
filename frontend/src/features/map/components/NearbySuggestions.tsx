import { MapPin } from 'lucide-react';
import { NearbySuggestion } from '../services/nearbySuggestions';
import { ratingLabel } from '../services/ratingLabel';

const categoryLabels = { RESTAURANT: 'Nhà hàng', CAFE: 'Cà phê', CINEMA: 'Rạp phim' } as const;

export function NearbySuggestions({
  items,
  onSelect,
}: {
  items: NearbySuggestion[];
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="nearby-suggestions" aria-label="Gợi ý địa điểm lân cận">
      <h2>Gợi ý quanh đây</h2>
      <p className="small">Trong 2 km đường chim bay; ưu tiên nhiều loại địa điểm khác nhau.</p>
      <div className="suggestion-list">
        {items.map(({ venue, distanceM }) => (
          <button key={venue.slug} className="suggestion-card" onClick={() => onSelect(venue.id)}>
            <span className="suggestion-icon" aria-hidden="true">
              <MapPin size={18} />
            </span>
            <span className="suggestion-content">
              <strong>{venue.name}</strong>
              <small>
                {categoryLabels[venue.category]} · {distanceM} m · {ratingLabel(venue.rating)}
              </small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
