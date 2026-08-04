import React, { useState, useEffect, useContext } from 'react';
import { interventionService } from '../services/api';
import InterventionCard from './InterventionCard';
import InterventionForm from './InterventionForm';
import { AuthContext } from '../context/AuthContext';

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

const Dashboard = () => {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const data = await interventionService.getAllInterventions(1, 50, '');
      setInterventions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching interventions:', err);
      setError('Impossible de charger les interventions. Le serveur backend est-il démarré ?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, [user]); // Re-fetch when user changes (login/logout)

  const handleInterventionCreated = (newIntervention) => {
    // Ajouter la nouvelle intervention en haut de la liste
    setInterventions(prev => [newIntervention, ...prev]);
  };

  return (
    <div className="container">
      <header className="app-header">
        <div>
          <h1 className="app-title">Gestion de Maintenance</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Tableau de bord des interventions
          </p>
        </div>
        <button className="btn-primary" onClick={fetchInterventions}>
          Actualiser
        </button>
      </header>

      <InterventionForm onInterventionCreated={handleInterventionCreated} />

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && user.role === 'Technician' ? 'Mes interventions' : 'Toutes les interventions'}
          <span style={{
            background: 'var(--bg-glass)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '1rem',
            border: '1px solid var(--border-subtle)'
          }}>
            {interventions.length}
          </span>
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Chargement des données...
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', borderLeft: '4px solid #ef4444' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      ) : (
        <div className="grid-cards">
          {interventions
            // Filter interventions for technicians: only show those assigned to the current user
            .filter(intervention => {
              // If not logged in or not a technician, show all interventions
              if (!user || user.role !== 'Technician') {
                return true;
              }

              // For technicians, only show interventions assigned to them
              // Check if intervention has a technician assigned and if that technician's username matches ours
              return (
                intervention.TechnicianId !== null &&
                intervention.TechnicianName !== null &&
                intervention.TechnicianName === user.username
              );
            })
            .map(intervention => (
              <InterventionCard key={intervention.id} intervention={intervention} />
            ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;