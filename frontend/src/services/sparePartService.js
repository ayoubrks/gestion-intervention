import api from './api';

const sparePartService = {
  getAllSpareParts: async (page = 1, pageSize = 50, search = '', lowStockOnly = false) => {
    let url = `/spareparts?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (lowStockOnly) url += `&lowStockOnly=true`;
    const response = await api.get(url);
    return response.data;
  },

  getSparePartById: async (id) => {
    const response = await api.get(`/spareparts/${id}`);
    return response.data;
  },

  createSparePart: async (data) => {
    const response = await api.post('/spareparts', data);
    return response.data;
  },

  updateSparePart: async (id, data) => {
    const response = await api.put(`/spareparts/${id}`, data);
    return response.data;
  },

  deleteSparePart: async (id) => {
    const response = await api.delete(`/spareparts/${id}`);
    return response.data;
  },

  adjustStock: async (id, quantityAdjustment) => {
    const response = await api.post(`/spareparts/${id}/adjust-stock`, quantityAdjustment, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  consumeSparePart: async (interventionId, data) => {
    const response = await api.post(`/spareparts/interventions/${interventionId}/consume`, data);
    return response.data;
  },

  getSparePartsUsedInIntervention: async (interventionId) => {
    const response = await api.get(`/spareparts/interventions/${interventionId}`);
    return response.data;
  }
};

export default sparePartService;
