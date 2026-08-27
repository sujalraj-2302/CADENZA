import { Plus, X } from 'lucide-react';
import { useState } from 'react';

export default function PollComposer({ onCreate, onCancel }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  function updateOption(index, value) {
    setOptions((prev) => prev.map((item, i) => i === index ? value : item));
  }

  function submit(e) {
    e.preventDefault();
    const cleanOptions = options.map((item) => item.trim()).filter(Boolean).slice(0, 4);
    if (!question.trim() || cleanOptions.length < 2) return;
    onCreate({ question: question.trim(), options: cleanOptions });
  }

  return (
    <form className="cad-poll-composer" onSubmit={submit}>
      <div className="cad-poll-composer-head"><strong>Start a poll</strong><button type="button" onClick={onCancel}><X size={14} /></button></div>
      <input className="cad-input" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What should we watch next?" maxLength={120} />
      {options.map((option, i) => (
        <div className="cad-poll-option-input" key={i}>
          <input className="cad-input" value={option} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} maxLength={80} />
          {options.length > 2 && <button type="button" onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}><X size={13} /></button>}
        </div>
      ))}
      <div className="cad-poll-composer-actions">
        {options.length < 4 && <button type="button" className="cad-poll-add-option" onClick={() => setOptions((prev) => [...prev, ''])}><Plus size={13} /> Add option</button>}
        <button className="cad-btn cad-btn-primary" type="submit">Pin poll</button>
      </div>
    </form>
  );
}
