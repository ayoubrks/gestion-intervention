import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, Mail, Lock, User, Shield, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState('3'); // Default to Technician (3)
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(username, email, password, roleId);
      setSuccess('Inscription réussie ! Redirection en cours...');
      setTimeout(() => {
        // Rediriger vers la page d'accueil (ou login)
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box glass-card animate-fade-in">
        <div className="register-header">
          <div className="register-logo">
            <Wrench size={32} color="white" />
          </div>
          <h2>Smart<span>Maintenance</span></h2>
          <p>Créez votre compte de gestion</p>
        </div>

        {error && <div className="register-error">{error}</div>}
        {success && <div className="register-success">{success}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label className="form-label">Nom d'utilisateur</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                className="form-input" 
                placeholder="tech_admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                className="form-input" 
                placeholder="nom@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Rôle initial</label>
            <div className="input-with-icon">
              <Shield size={18} className="input-icon" />
              <select 
                className="form-input"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                style={{ paddingLeft: '42px', appearance: 'none', WebkitAppearance: 'none' }}
                required
              >
                <option value="3">Technicien</option>
                <option value="2">Manager</option>
                <option value="1">Administrateur</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary register-btn" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : "S'inscrire"}
          </button>
        </form>

        <div className="register-footer text-center mt-4">
          <p className="text-muted">
            Déjà inscrit ? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
