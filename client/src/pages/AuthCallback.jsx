import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    
    if (error) {
      console.error('OAuth error:', error);
      navigate('/login?error=auth_failed', { replace: true });
      return;
    }

    if (token) {
      localStorage.setItem('auth_token', token);
      // Clear any cached auth data to force fresh check
      localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
      navigate('/dashboard', { replace: true });
    } else {
      console.error('No token received in callback');
      navigate('/login?error=auth_failed', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Signing you in…</p>
    </div>
  );
}
