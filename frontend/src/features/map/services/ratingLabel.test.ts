import { describe, expect, it } from 'vitest';
import { ratingLabel } from './ratingLabel';

describe('ratingLabel', () => {
  it('shows stars only when a venue has a rating', () => {
    expect(ratingLabel(4.7)).toBe('★ 4.7');
    expect(ratingLabel(0)).toBe('Chưa có đánh giá');
    expect(ratingLabel(Number.NaN)).toBe('Chưa có đánh giá');
  });
});
