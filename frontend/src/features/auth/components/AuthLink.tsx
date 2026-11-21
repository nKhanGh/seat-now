import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function AuthLink({ mode = 'login', children }: { mode?: 'login' | 'register'; children: ReactNode }) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  return (
    <Link to={`/${mode}`} state={{ returnTo }}>
      {children}
    </Link>
  );
}
