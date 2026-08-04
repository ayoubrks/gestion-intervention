import React, { useState } from 'react';
import { interventionService } from '../services/api';

const InterventionForm = ({ onInterventionCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technicianName: '',
    photoUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    
    setIsSubmitting(true);
    try {
      const newIntervention = await interventionService.create({
        ...formData,
        status: 'Pending'
      });
      onInterventionCreated(newIntervention);
      setFormData({ title: '', description: '', technicianName: '', photoUrl: '' });
    } catch (error) {
      alert("Erreur lors de la création de l'intervention");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
      <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Nouvelle Intervention</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="input-group">
            <label htmlFor="title">Titre *</label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              className="input-field" 
              value={formData.title} 
              onChange={handleChange} 
              required 
              placeholder="Ex: Fuite d'eau"
            />
          </div>
          <div className="input-group">
            <label htmlFor="technicianName">Technicien</label>
            <input 
              type="text" 
              id="technicianName" 
              name="technicianName" 
              className="input-field" 
              value={formData.technicianName} 
              onChange={handleChange} 
              placeholder="Ex: Jean Dupont"
            />
          </div>
        </div>
        
        <div className="input-group">
          <label htmlFor="description">Description *</label>
          <textarea 
            id="description" 
            name="description" 
            className="input-field" 
            rows="3"
            value={formData.description} 
            onChange={handleChange} 
            required
            placeholder="Détails du problème..."
            style={{ resize: 'vertical' }}
          ></textarea>
        </div>

        <div className="input-group">
          <label htmlFor="photoUrl">URL de la photo (Optionnel)</label>
          <input 
            type="url" 
            id="photoUrl" 
            name="photoUrl" 
            className="input-field" 
            value={formData.photoUrl} 
            onChange={handleChange} 
            placeholder="https://exemple.com/photo.jpg"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer l\'intervention'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InterventionForm;
