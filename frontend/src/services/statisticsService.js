import api from './api';

const statisticsService = {
  getDashboardStats: async () => {
    const response = await api.get('/statistics/dashboard');
    return response.data;
  },

  getAISynthesis: async () => {
    const response = await api.get('/statistics/ai-synthesis');
    return response.data;
  }
};

export default statisticsService;
