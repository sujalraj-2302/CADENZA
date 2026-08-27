import { useEffect, useState } from 'react';
import { Check, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { addGroupMember, createGroup, deleteGroup, getGroups } from '../../api/groups';

export default function FriendGroups() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(null);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { getGroups().then(({ groups: next }) => setGroups(next)).catch(() => setError('Could not load groups.')); }, []);

  async function handleCreate(event) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      const { group } = await createGroup(name.trim());
      setGroups((prev) => [...prev, group]); setName(''); setSelected(group._id);
    } catch (err) { setError(err?.response?.data?.error || 'Could not create group.'); }
  }

  async function handleAdd(event) {
    event.preventDefault();
    if (!username.trim() || !selected) return;
    try {
      const { group } = await addGroupMember(selected, username.trim());
      setGroups((prev) => prev.map((item) => item._id === group._id ? group : item)); setUsername('');
    } catch (err) { setError(err?.response?.data?.error || 'Could not add friend.'); }
  }

  async function handleDelete(groupId) {
    try { await deleteGroup(groupId); setGroups((prev) => prev.filter((group) => group._id !== groupId)); setSelected(null); } catch { setError('Could not delete group.'); }
  }

  return (
    <section className="cad-groups cad-card">
      <div className="cad-groups-heading"><div><Users size={16} /><strong>Friend groups</strong></div><span>Keep regular watch parties close.</span></div>
      <form className="cad-group-create" onSubmit={handleCreate}>
        <input className="cad-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name" maxLength={60} />
        <button className="cad-btn cad-btn-primary" type="submit" aria-label="Create friend group"><Plus size={15} /></button>
      </form>
      {groups.length > 0 && <div className="cad-group-list">{groups.map((group) => <button type="button" key={group._id} className={`cad-group-item${selected === group._id ? ' active' : ''}`} onClick={() => setSelected(group._id)}><span>{group.name}</span><small>{group.members.length} friends</small></button>)}</div>}
      {selected && <form className="cad-group-add" onSubmit={handleAdd}><input className="cad-input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Friend's username" /><button className="cad-btn cad-btn-ghost" type="submit"><UserPlus size={14} /> Add</button><button className="cad-group-delete" type="button" onClick={() => handleDelete(selected)} aria-label="Delete group"><Trash2 size={14} /></button></form>}
      {selected && <div className="cad-group-members">{groups.find((group) => group._id === selected)?.members.map((member) => <span key={member._id}><Check size={12} /> {member.name} <small>@{member.username}</small></span>)}</div>}
      {error && <p className="cad-error-text">{error}</p>}
    </section>
  );
}
