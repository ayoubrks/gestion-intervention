import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import BaseLayout from './components/Layout/BaseLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Users from './pages/Users';
import Equipments from './pages/Equipments';
import Interventions from './pages/Interventions';
import Preventive from './pages/Preventive';
import SpareParts from './pages/SpareParts';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  
  if (loading) return <div>Chargement...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<ProtectedRoute><BaseLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="equipments" element={<Equipments />} />
          <Route path="interventions" element={<Interventions />} />
          <Route path="preventive" element={<Preventive />} />
          <Route path="spare-parts" element={<SpareParts />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
