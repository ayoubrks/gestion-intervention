import api from './api';

const equipmentService = {
  getAllEquipments: async (page = 1, pageSize = 20, search = '', categoryId = '') => {
    let url = `/equipments?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getEquipmentById: async (id) => {
    const response = await api.get(`/equipments/${id}`);
    return response.data;
  },

  createEquipment: async (data) => {
    const response = await api.post('/equipments', data);
    return response.data;
  },

  updateEquipment: async (id, data) => {
    const response = await api.put(`/equipments/${id}`, data);
    return response.data;
  },

  deleteEquipment: async (id) => {
    const response = await api.delete(`/equipments/${id}`);
    return response.data;
  },

  getAllCategories: async () => {
    const response = await api.get('/equipments/categories');
    return response.data;
  },

  createCategory: async (data) => {
    const response = await api.post('/equipments/categories', data);
    return response.data;
  },

  updateCategory: async (id, data) => {
    const response = await api.put(`/equipments/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/equipments/categories/${id}`);
    return response.data;
  }
};

export default equipmentService;
