import { useState } from 'react';
import { Check, Clock3, Copy, Flower2, Film, Sparkles, Ticket, WandSparkles } from 'lucide-react';
import Modal from './Modal';

const CARD_GENRES = [
  { id: 'botanical', label: 'Botanical', icon: Flower2, image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1000&q=80' },
  { id: 'cinema', label: 'Cinema', icon: Film, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80' },
  { id: 'aurora', label: 'Aurora', icon: Sparkles, image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1000&q=80' },
  { id: 'postcard', label: 'Postcard', icon: Ticket, image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80' },
  { id: 'minimal', label: 'Minimal', icon: WandSparkles, image: null },
];

export default function InviteModal({ room, inviterName, onClose }) {
  const [copied, setCopied] = useState(false);
  const [genre, setGenre] = useState('botanical');
  const link = `${window.location.origin}/room/${room.roomCode}`;
  const invitedAt = new Date();
  const selectedGenre = CARD_GENRES.find((item) => item.id === genre);
  const inviteText = `CADENZA: ${room.name}\n${inviterName || room.host?.name || 'Your host'} invites you to join.\nCard style: ${selectedGenre.label}\nRoom code: ${room.roomCode}\n${link}`;

  async function copy(value) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function shareInvitation() {
    if (navigator.share) {
      await navigator.share({ title: `CADENZA - ${room.name}`, text: inviteText, url: link });
    } else {
      await copy(inviteText);
    }
  }

  return (
    <Modal title="Share CADENZA" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="cad-invite-genres" role="radiogroup" aria-label="Invitation card style">
          {CARD_GENRES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`cad-invite-genre${genre === id ? ' active' : ''}`} onClick={() => setGenre(id)} role="radio" aria-checked={genre === id}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        <div className={`cad-invite-card genre-${genre}`} style={selectedGenre.image ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.76)), url(${selectedGenre.image})` } : undefined}>
          <selectedGenre.icon size={18} />
          <strong>CADENZA</strong>
          <span>{room.name}</span>
          <small>{room.host?.name || inviterName || 'Your host'} invites you</small>
          <small><Clock3 size={12} /> {invitedAt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</small>
        </div>
        <div
          style={{
            fontFamily: 'var(--cad-font-display)',
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: '0.15em',
            color: 'var(--cad-gold)',
          }}
        >
          {room.roomCode}
        </div>

        <button className="cad-btn cad-btn-primary" style={{ width: '100%' }} onClick={() => copy(inviteText)}>
          {copied ? <><Check size={14} style={{ marginRight: 6 }} />Copied</> : <><Copy size={14} style={{ marginRight: 6 }} />Copy Invitation</>}
        </button>
        <button className="cad-btn cad-btn-ghost" style={{ width: '100%' }} onClick={shareInvitation}>
          Share This Card
        </button>
        <button className="cad-btn cad-btn-ghost" style={{ width: '100%' }} onClick={() => copy(link)}>
          Copy Shareable Link
        </button>
      </div>
    </Modal>
  );
}
