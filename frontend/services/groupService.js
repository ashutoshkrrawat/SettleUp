import api from '../src/utils/api';

const getGroups = async () => {
  const { data } = await api.get('/groups');
  return data;
};

const getGroupDetails = async (groupId) => {
  const { data } = await api.get(`/groups/${groupId}`);
  return data;
};

const createGroup = async (name, description) => {
  const { data } = await api.post('/groups', { name, description });
  return data;
};

const inviteMember = async (groupId, email) => {
  const { data } = await api.post(`/groups/${groupId}/invite`, { email });
  return data;
};

const removeMember = async (groupId, userId) => {
  const { data } = await api.post(`/groups/${groupId}/remove-member`, { userId });
  return data;
};

const joinGroup = async (inviteCode) => {
  const { data } = await api.post(`/groups/join/${inviteCode}`);
  return data;
};

const resetInvite = async (groupId) => {
  const { data } = await api.post(`/groups/${groupId}/reset-invite`);
  return data;
};

const sendReminders = async (groupId) => {
  const { data } = await api.post(`/groups/${groupId}/remind`);
  return data;
};

export default {
  getGroups,
  getGroupDetails,
  createGroup,
  inviteMember,
  removeMember,
  joinGroup,
  resetInvite,
  sendReminders,
};

