import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data && response.data.token) {
      const user = {
        username: response.data.username,
        role: response.data.role
      };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      response.data.user = user;
    }
    return response.data;
  },

  register: async (username, email, password, roleId) => {
    const response = await api.post('/auth/register', { 
      username, 
      email, 
      password, 
      roleId: parseInt(roleId) 
    });
    if (response.data && response.data.token) {
      const user = {
        username: response.data.username,
        role: response.data.role
      };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      response.data.user = user;
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
};

export default authService;
