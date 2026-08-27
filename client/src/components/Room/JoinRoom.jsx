import { useState } from 'react';
import Modal from './Modal';
import { joinRoom } from '../../api/rooms';

export default function JoinRoom({ onClose, onJoined }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { room } = await joinRoom(code.trim());
      onJoined(room);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) setError('Room not found.');
      else if (status === 403) setError('Unable to join room.');
      else setError('Unable to join room.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Join CADENZA Room" onClose={onClose}>
      <form className="cad-form" onSubmit={handleSubmit}>
        <input
          className="cad-input"
          placeholder="Room code, e.g. A7X91K"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          style={{ textAlign: 'center', letterSpacing: '0.2em', fontWeight: 600 }}
          required
        />
        {error && <p className="cad-error-text">{error}</p>}
        <button className="cad-btn cad-btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Joining…' : 'Join Room'}
        </button>
      </form>
    </Modal>
  );
}
