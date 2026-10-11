import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  LayoutDashboard, Wrench, CalendarClock, ShieldCheck,
  Package, Settings, Users, Box
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const navItems = [
    { path: '/',             icon: <LayoutDashboard size={17} />, label: 'Tableau de bord' },
    { path: '/equipments',  icon: <Wrench size={17} />,          label: 'Équipements' },
    { path: '/interventions',icon: <CalendarClock size={17} />,  label: 'Interventions' },
    { path: '/preventive',  icon: <ShieldCheck size={17} />,     label: 'Préventif' },
    { path: '/spare-parts', icon: <Package size={17} />,         label: 'Pièces de rechange' },
    { path: '/users',       icon: <Users size={17} />,           label: 'Utilisateurs' },
    { path: '/settings',    icon: <Settings size={17} />,        label: 'Paramètres' },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <Box size={18} color="white" strokeWidth={2} />
        </div>
        <div>
          <div className="logo-text">SmartMaint</div>
          <div className="logo-subtitle">{user?.role || 'Système'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-pulse" />
          <span>Système en ligne</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
