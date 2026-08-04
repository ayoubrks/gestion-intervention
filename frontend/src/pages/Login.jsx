import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, User, Lock, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box glass-card animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <Wrench size={32} color="white" />
          </div>
          <h2>Smart<span>Maintenance</span></h2>
          <p>Connectez-vous pour accéder à votre espace</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Nom d'utilisateur ou Email</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                className="form-input" 
                placeholder="tech_admin ou admin@smartmaintenance.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
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

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer text-center mt-4">
          <p className="text-muted">
            Pas encore de compte ? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
