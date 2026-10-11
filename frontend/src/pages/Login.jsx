import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Loader2 } from 'lucide-react';
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
      setError(err.response?.data?.message || 'Incorrect credentials. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper animate-fade-in">
        
        {/* Logo Header */}
        <div className="login-brand">
          <Box size={28} className="brand-icon" />
          <h1 className="brand-text">SmartMaint</h1>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <input 
                type="text" 
                className={`login-input ${error ? 'input-error' : ''}`}
                placeholder="name@company.com"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                required
              />
            </div>

            <div className="form-group">
              <input 
                type="password" 
                className={`login-input ${error ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
              />
              {error && <div className="error-message">{error}</div>}
              {error && (
                <div className="forgot-password">
                  <a href="#">Forgot password?</a>
                </div>
              )}
            </div>

            <button type="submit" className="btn-login-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Login'}
            </button>
          </form>

          <div className="signup-link">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>

        {/* Terms */}
        <div className="login-terms">
          By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </div>
        
      </div>
    </div>
  );
};

export default Login;
