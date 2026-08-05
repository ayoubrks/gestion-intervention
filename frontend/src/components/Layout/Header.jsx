import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import { Bell, Search, LogOut, CheckCheck, AlertCircle } from 'lucide-react';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen]     = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Erreur notifications:', err);
    }
  };

  const handleMarkAll = async () => {
    try { await notificationService.markAllAsRead(); fetchNotifications(); }
    catch (err) { console.error(err); }
  };

  const handleMarkOne = async (id) => {
    try { await notificationService.markAsRead(id); fetchNotifications(); }
    catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?';

  return (
    <header className="header">
      {/* Search */}
      <div className="header-search">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher équipement, intervention..."
            className="search-input"
          />
        </div>
      </div>

      <div className="header-actions">
        {/* Notifications */}
        <div className="notif-container">
          <button
            className="notif-trigger"
            onClick={() => setIsNotifOpen(o => !o)}
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {isNotifOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <h4>Notifications {unreadCount > 0 && `(${unreadCount})`}</h4>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={handleMarkAll}>
                    <CheckCheck size={12} /> Tout lire
                  </button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <AlertCircle size={22} />
                    <span>Aucune notification</span>
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                    onClick={() => handleMarkOne(n.id)}
                  >
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User chip */}
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <span className="user-name">{user?.username || 'Utilisateur'}</span>
            <span className="user-role">{user?.role || 'Technicien'}</span>
          </div>
        </div>

        {/* Logout */}
        <button className="logout-btn" onClick={logout} title="Se déconnecter">
          <LogOut size={15} />
          <span>Déconnexion</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
