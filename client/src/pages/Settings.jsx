import Logo from '../components/Logo/Logo';
import ProfileMenu from '../components/Navbar/ProfileMenu';

export default function Settings() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cad-bg)' }}>
      <header className="cad-topbar">
        <Logo size={22} />
        <ProfileMenu />
      </header>
      <main style={{ maxWidth: 420, margin: '80px auto', textAlign: 'center', color: 'var(--cad-text-dim)' }}>
        <p>Settings coming soon.</p>
      </main>
    </div>
  );
}
