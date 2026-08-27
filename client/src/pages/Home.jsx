import { motion } from 'framer-motion';
import { MessageCircle, Play, Users, Vote } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo/Logo';
import ProfileMenu from '../components/Navbar/ProfileMenu';
import CreateRoom from '../components/Room/CreateRoom';
import JoinRoom from '../components/Room/JoinRoom';
import FriendGroups from '../components/Common/FriendGroups';
import './home.css';

const FEATURES = [
  { icon: Users, title: 'Synchronized watching', text: 'Shared playback keeps the room on the same scene.' },
  { icon: MessageCircle, title: 'Chat that feels live', text: 'Reply to a message and react with an emoji instantly.' },
  { icon: Vote, title: 'Watch together', text: 'Queue votes and host/moderator polls keep everyone involved.' },
  { icon: Play, title: 'Low playback drift', text: 'The server continuously corrects meaningful timing differences.' },
];

export default function Home() {
  const [modal, setModal] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="cad-home">
      <header className="cad-topbar">
        <Logo size={26} />
        <ProfileMenu />
      </header>

      <main className="cad-home-main">
        <div className="cad-home-heading">
          <p className="cad-home-kicker">One Room. One Rhythm.</p>
          <h1>Why CADENZA feels different.</h1>
          <p>Less switching. Less waiting. More watching together.</p>
        </div>

        <section className="cad-home-features">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <motion.article key={title} className="cad-home-feature" whileHover={{ y: -4 }}>
              <Icon size={18} />
              <h2>{title}</h2>
              <p>{text}</p>
            </motion.article>
          ))}
        </section>

        <div className="cad-home-actions">
          <button className="cad-btn cad-btn-primary" onClick={() => setModal('create')}>Create Room</button>
          <span className="cad-home-or">or</span>
          <button className="cad-btn cad-btn-ghost" onClick={() => setModal('join')}>Join Room</button>
        </div>

        <FriendGroups />

        <p className="cad-home-powered">Co-powered by <strong>Sujal Raj</strong></p>
      </main>

      {modal === 'create' && (
        <CreateRoom onClose={() => setModal(null)} onCreated={(room) => navigate(`/room/${room.roomCode}`)} />
      )}
      {modal === 'join' && (
        <JoinRoom onClose={() => setModal(null)} onJoined={(room) => navigate(`/room/${room.roomCode}`)} />
      )}
    </div>
  );
}
