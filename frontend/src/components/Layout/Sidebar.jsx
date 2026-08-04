import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  CalendarClock, 
  Package, 
  Settings, 
  Users 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
    { path: '/equipments', icon: <Wrench size={20} />, label: 'Équipements' },
    { path: '/interventions', icon: <CalendarClock size={20} />, label: 'Interventions' },
    { path: '/preventive', icon: <CalendarClock size={20} />, label: 'Préventif' },
    { path: '/spare-parts', icon: <Package size={20} />, label: 'Pièces de rechange' },
    { path: '/users', icon: <Users size={20} />, label: 'Utilisateurs' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Paramètres' },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <Wrench size={24} color="white" />
          </div>
          <h2 className="logo-text">Smart<span>Maintenance</span></h2>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="system-status">
          <span className="status-dot"></span>
          <span className="status-text">Système en ligne</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
