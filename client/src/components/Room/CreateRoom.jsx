import { useState } from 'react';
import Modal from './Modal';
import { createRoom } from '../../api/rooms';

const PRIVACY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'link-only', label: 'Link Only' },
  { value: 'public', label: 'Public' },
];

export default function CreateRoom({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [privacy, setPrivacy] = useState('link-only');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { room } = await createRoom({ name, privacy });
      onCreated(room);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not create room.');
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Create Room" onClose={onClose}>
      <form className="cad-form" onSubmit={handleSubmit}>
        <div>
          <div className="cad-label" style={{ marginBottom: 6 }}>Room name</div>
          <input
            className="cad-input"
            placeholder="Friday night movies"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        </div>

        <div>
          <div className="cad-label" style={{ marginBottom: 6 }}>Privacy</div>
          <div className="cad-radio-group">
            {PRIVACY_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.value}
                className={`cad-radio-option${privacy === opt.value ? ' active' : ''}`}
                onClick={() => setPrivacy(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="cad-error-text">{error}</p>}

        <button className="cad-btn cad-btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Room'}
        </button>
      </form>
    </Modal>
  );
}
