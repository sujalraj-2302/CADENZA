import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Play, Users, Vote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoIntro from '../components/Logo/LogoIntro';
import Logo from '../components/Logo/Logo';
import { useAuth } from '../context/AuthContext';
import './landing.css';

const FEATURES = [
  { icon: Users, title: 'One synchronized room', text: 'Everyone watches the same moment together.' },
  { icon: MessageCircle, title: 'Live conversation', text: 'Chat, reply to messages, and react without leaving the video.' },
  { icon: Vote, title: 'Community control', text: 'Vote on the queue and let hosts run live polls.' },
  { icon: Play, title: 'Low-drift playback', text: 'Server-timed playback keeps viewers tightly aligned.' },
];

export default function Landing() {
  const [introDone, setIntroDone] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate('/home', { replace: true });
  }, [loading, user, navigate]);

  if (!loading && user) return null;

  return (
    <div className="cad-landing">
      {!introDone && <LogoIntro onDone={() => setIntroDone(true)} />}

      {introDone && (
        <motion.main
          className="cad-landing-content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <div className="cad-landing-brand">
            <Logo size={64} />
            <p>One Room. One Rhythm.</p>
          </div>

          <p className="cad-landing-intro">
            Watch together, talk together, and keep every screen in sync.
          </p>

          <section className="cad-feature-grid" aria-label="Why CADENZA is different">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <motion.article
                key={title}
                className="cad-feature-card"
                whileHover={{ y: -5, borderColor: 'rgba(212,168,79,0.34)' }}
                transition={{ duration: 0.2 }}
              >
                <Icon size={20} />
                <h2>{title}</h2>
                <p>{text}</p>
              </motion.article>
            ))}
          </section>

          <div className="cad-landing-actions">
            <button className="cad-btn cad-btn-primary" onClick={() => navigate('/login')}>Login</button>
            <button className="cad-btn cad-btn-ghost" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>

          <footer className="cad-landing-footer">
            <span>Co-powered by</span>
            <strong>Sujal Raj</strong>
            <span>·</span>
            <span>One room, shared in real time.</span>
          </footer>
        </motion.main>
      )}
    </div>
  );
}
