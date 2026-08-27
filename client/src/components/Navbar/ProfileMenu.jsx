import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './navbar.css';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="cad-profile" ref={ref}>
      <button className="cad-profile-trigger cad-focus" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="cad-avatar" />
        ) : (
          <span className="cad-avatar cad-avatar-initials">{initials}</span>
        )}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="cad-profile-menu" role="menu">
          <button role="menuitem" onClick={() => { setOpen(false); navigate('/profile'); }}>
            <User size={15} /> Profile
          </button>
          <button role="menuitem" onClick={() => { setOpen(false); navigate('/settings'); }}>
            <Settings size={15} /> Settings
          </button>
          <button role="menuitem" className="cad-profile-logout" onClick={() => logout()}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
