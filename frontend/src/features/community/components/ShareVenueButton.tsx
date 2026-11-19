import { useState } from 'react';

export function ShareVenueButton({ slug, lat, lng }: { slug: string; lat: number; lng: number }) {
  const [message, setMessage] = useState('');

  async function copyLink() {
    const url = new URL('/', window.location.origin);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lng', String(lng));
    url.searchParams.set('venue', slug);
    try {
      await navigator.clipboard.writeText(url.toString());
      setMessage('Đã sao chép link địa điểm.');
    } catch {
      setMessage('Không sao chép được link trên trình duyệt này.');
    }
  }

  return (
    <span className="share-action">
      <button onClick={() => void copyLink()}>Chia sẻ địa điểm</button>
      {message && <span role="status">{message}</span>}
    </span>
  );
}
