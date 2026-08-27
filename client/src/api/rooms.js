import api from './axios';

export const createRoom = (data) => api.post('/rooms', data).then((r) => r.data);
export const getRoom = (roomCode) => api.get(`/rooms/${roomCode}`).then((r) => r.data);
export const joinRoom = (roomCode) => api.post(`/rooms/${roomCode}/join`).then((r) => r.data);
export const leaveRoom = (roomCode) => api.post(`/rooms/${roomCode}/leave`).then((r) => r.data);
