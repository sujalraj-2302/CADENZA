import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../Logo/Logo';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cad-bg)' }}>
        <Logo size={28} />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return children;
}
