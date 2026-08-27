import api from './axios';

export const getGroups = () => api.get('/groups').then((r) => r.data);
export const createGroup = (name) => api.post('/groups', { name }).then((r) => r.data);
export const addGroupMember = (groupId, username) => api.post(`/groups/${groupId}/members`, { username }).then((r) => r.data);
export const deleteGroup = (groupId) => api.delete(`/groups/${groupId}`).then((r) => r.data);