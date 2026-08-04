import api from './api';

// Helper function to decode JWT token and extract user ID
const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    // JWT token format: header.payload.signature
    const payload = token.split('.')[1];
    // Replace URL-safe characters
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsedPayload = JSON.parse(decodedPayload);
    // The user ID is in the NameIdentifier claim (http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier)
    // which is typically mapped to 'nameid' or 'sub' in JWT
    return parsedPayload.nameid || parsedPayload.sub || null;
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
};

const interventionService = {
  getAllInterventions: async (page = 1, pageSize = 50, status = '') => {
    let url = `/interventions?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    const response = await api.get(url);
    return response.data;
  },

  getInterventionById: async (id) => {
    const response = await api.get(`/interventions/${id}`);
    return response.data;
  },

  createIntervention: async (data) => {
    const response = await api.post('/interventions', data);
    return response.data;
  },

  assignTechnician: async (id, data) => {
    const response = await api.post(`/interventions/${id}/assign`, data);
    return response.data;
  },

  startIntervention: async (id) => {
    const response = await api.post(`/interventions/${id}/start`);
    return response.data;
  },

  completeIntervention: async (id, data) => {
    const response = await api.post(`/interventions/${id}/complete`, data);
    return response.data;
  },

  cancelIntervention: async (id, reason) => {
    // Note: L'API backend attend un simple string comme [FromBody] pour le motif,
    // axios l'envoie en tant que data brute avec le bon header si on fait :
    const response = await api.post(`/interventions/${id}/cancel`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  getInterventionHistory: async (id) => {
    const response = await api.get(`/interventions/${id}/history`);
    return response.data;
  }
};

export default interventionService;
