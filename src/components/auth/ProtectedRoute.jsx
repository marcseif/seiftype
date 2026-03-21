import { Navigate } from 'react-router-dom';
import useUserStore from '../../stores/userStore';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useUserStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
