import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import { Bell, Search, User, LogOut, CheckCheck, AlertCircle } from 'lucide-react';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error("Erreur marquer tout comme lu:", err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error("Erreur marquer comme lu:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="header glass-panel">
      <div className="header-search">
        <div className="search-input-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher équipement, intervention..." 
            className="search-input"
          />
        </div>
      </div>
      
      <div className="header-actions">
        {/* Notifications Dropdown */}
        <div className="notification-container">
          <button className="icon-btn" title="Notifications" onClick={() => setIsNotifOpen(!isNotifOpen)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>

          {isNotifOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications ({unreadCount} non lues)</h4>
                {unreadCount > 0 && (
                  <button className="mark-all-btn flex items-center gap-1" onClick={handleMarkAllRead}>
                    <CheckCheck size={14}/> Tout marquer comme lu
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted flex flex-col items-center gap-2">
                    <AlertCircle size={24}/>
                    <span>Aucune notification</span>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                      onClick={() => handleMarkAsRead(n.id)}
                    >
                      <div>{n.message}</div>
                      <span className="notification-time">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Profil Utilisateur Connecté */}
        <div className="user-profile">
          <div className="avatar">
            {user?.username ? user.username[0].toUpperCase() : <User size={18} />}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username || 'Utilisateur'}</span>
            <span className="user-role">{user?.role || 'Technicien'}</span>
          </div>
        </div>

        {/* Bouton de Déconnexion */}
        <button className="logout-btn" title="Se déconnecter" onClick={logout}>
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
