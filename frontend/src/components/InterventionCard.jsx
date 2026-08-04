import React from 'react';

const InterventionCard = ({ intervention }) => {
  const { title, description, status, technicianName, photoUrl, createdAt } = intervention;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'inprogress': return 'status-inprogress';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
    }
  };

  const getStatusText = (status) => {
    switch(status.toLowerCase()) {
      case 'inprogress': return 'En Cours';
      case 'completed': return 'Terminé';
      default: return 'En Attente';
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        <span className={`status-badge ${getStatusClass(status)}`}>
          {getStatusText(status)}
        </span>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '4px 0', flex: 1 }}>
        {description}
      </p>

      {photoUrl && (
        <div style={{ width: '100%', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', margin: '8px 0' }}>
          <img src={photoUrl} alt="Intervention" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Technicien:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{technicianName || 'Non assigné'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Créé le:</span>
          <span style={{ color: 'var(--text-primary)' }}>{formatDate(createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default InterventionCard;
