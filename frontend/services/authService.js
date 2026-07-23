import api from '../src/utils/api'; // Or '../utils/api' if inside src/services/

const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

const register = async (name, email, password) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export default { login, register, getMe };
