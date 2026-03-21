import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthModal from '../components/auth/AuthModal';
import useUserStore from '../stores/userStore';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <AuthModal
        isOpen={true}
        onClose={() => navigate('/')}
        defaultMode={mode}
      />
    </div>
  );
}
