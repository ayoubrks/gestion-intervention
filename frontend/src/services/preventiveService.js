import api from './api';

const preventiveService = {
  getAllPlans: async (page = 1, pageSize = 50, equipmentId = null) => {
    let url = `/preventivemaintenances/plans?page=${page}&pageSize=${pageSize}`;
    if (equipmentId) url += `&equipmentId=${equipmentId}`;
    const response = await api.get(url);
    return response.data;
  },

  getPlanById: async (id) => {
    const response = await api.get(`/preventivemaintenances/plans/${id}`);
    return response.data;
  },

  createPlan: async (data) => {
    const response = await api.post('/preventivemaintenances/plans', data);
    return response.data;
  },

  deletePlan: async (id) => {
    const response = await api.delete(`/preventivemaintenances/plans/${id}`);
    return response.data;
  },

  generateTasks: async (id, count = 1) => {
    const response = await api.post(`/preventivemaintenances/plans/${id}/generate-tasks?count=${count}`);
    return response.data;
  },

  getAllTasks: async (page = 1, pageSize = 50, status = '', equipmentId = null) => {
    let url = `/preventivemaintenances/tasks?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    if (equipmentId) url += `&equipmentId=${equipmentId}`;
    const response = await api.get(url);
    return response.data;
  },

  completeTask: async (id, remarks) => {
    const response = await api.post(`/preventivemaintenances/tasks/${id}/complete`, { remarks });
    return response.data;
  },

  convertToIntervention: async (id) => {
    const response = await api.post(`/preventivemaintenances/tasks/${id}/convert-to-intervention`);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/preventivemaintenances/tasks/${id}`);
    return response.data;
  }
};

export default preventiveService;
