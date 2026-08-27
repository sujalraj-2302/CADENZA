import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo/Logo';
import ProfileMenu from '../components/Navbar/ProfileMenu';

export default function Profile() {
  const { user } = useAuth();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cad-bg)' }}>
      <header className="cad-topbar">
        <Logo size={22} />
        <ProfileMenu />
      </header>
      <main style={{ maxWidth: 420, margin: '80px auto', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <span className="cad-avatar cad-avatar-initials" style={{ width: 64, height: 64, fontSize: 20 }}>
          {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
        </span>
        <h2 style={{ fontFamily: 'var(--cad-font-display)', margin: 0 }}>{user.name}</h2>
        <p style={{ color: 'var(--cad-text-dim)', margin: 0 }}>@{user.username}</p>
        <p style={{ color: 'var(--cad-text-faint)', fontSize: 13, margin: 0 }}>{user.email}</p>
      </main>
    </div>
  );
}
