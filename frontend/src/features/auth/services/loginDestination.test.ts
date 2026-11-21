import { describe, expect, it, vi } from 'vitest';
import { loginDestination } from './loginDestination';

describe('loginDestination', () => {
  it('opens admin without checking business ownership', async () => {
    const lookup = vi.fn().mockResolvedValue(true);
    await expect(loginDestination('ADMIN', '/?venue=demo-hcm-028', lookup)).resolves.toBe('/admin');
    expect(lookup).not.toHaveBeenCalled();
  });

  it('opens business for an approved owner even when login began from a venue', async () => {
    await expect(loginDestination('USER', '/?venue=demo-hcm-028', () => Promise.resolve(true))).resolves.toBe(
      '/business',
    );
  });

  it('keeps the original destination for users without a managed venue', async () => {
    await expect(loginDestination('USER', '/favorites', () => Promise.resolve(false))).resolves.toBe(
      '/favorites',
    );
  });

  it('keeps login usable when the owner lookup fails', async () => {
    await expect(
      loginDestination('USER', '/favorites', () => Promise.reject(new Error('network'))),
    ).resolves.toBe('/favorites');
  });
});
