import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useShopQueries';
import { Loading } from '../components/Status';

export function ProtectedRoute() {
  const { data: user, isPending, isError } = useCurrentUser();
  const location = useLocation();
  if (isPending) return <Loading label="Checking your account…" />;
  if (isError || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
