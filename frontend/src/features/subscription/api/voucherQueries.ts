import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { voucherService } from '../services/voucher.service';

const offersKey = ['premium', 'vouchers', 'offers'] as const;
const mineKey = ['premium', 'vouchers', 'mine'] as const;
const adminKey = ['admin', 'vouchers'] as const;

export function useVoucherOffers(enabled: boolean) {
  return useQuery({
    queryKey: offersKey,
    queryFn: ({ signal }) => voucherService.offers(signal),
    enabled,
    staleTime: 15_000,
  });
}

export function useMyVouchers(enabled: boolean) {
  return useQuery({
    queryKey: mineKey,
    queryFn: ({ signal }) => voucherService.mine(signal),
    enabled,
    staleTime: 15_000,
  });
}

export function useClaimVoucher() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: voucherService.claim,
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: offersKey }),
        client.invalidateQueries({ queryKey: mineKey }),
      ]),
  });
}

export function useAdminVouchers(enabled: boolean) {
  return useQuery({
    queryKey: adminKey,
    queryFn: ({ signal }) => voucherService.adminOffers(signal),
    enabled,
  });
}

export function useCreateVoucher() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: voucherService.create,
    onSuccess: () => client.invalidateQueries({ queryKey: adminKey }),
  });
}

export function useDeactivateVoucher() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: voucherService.deactivate,
    onSuccess: () => client.invalidateQueries({ queryKey: adminKey }),
  });
}
