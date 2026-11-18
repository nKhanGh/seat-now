import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';

export const authQueryKey = ['auth', 'me'] as const;

export function useCurrentUser() {
  return useQuery({ queryKey: authQueryKey, queryFn: authService.me, retry: false });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ email, password }: { email: string; password: string }) => authService.login(email, password), onSuccess: (user) => client.setQueryData(authQueryKey, user) });
}

export function useRegister() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ email, password, displayName }: { email: string; password: string; displayName: string }) => authService.register(email, password, displayName), onSuccess: (user) => client.setQueryData(authQueryKey, user) });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({ mutationFn: authService.logout, onSuccess: () => { client.clear(); client.setQueryData(authQueryKey, null); } });
}
