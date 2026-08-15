import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import { Bell, LogOut, CheckCheck, AlertCircle, Trash2 } from 'lucide-react';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

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
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOne = async (e, id) => {
    e.stopPropagation(); // prevent markAsRead trigger
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Erreur suppression notification:', err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
    } catch (err) {
      console.error('Erreur suppression toutes notifications:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?';

  return (
    <header className="header">
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
                <div className="notif-actions-group">
                  {unreadCount > 0 && (
                    <button className="notif-action-btn notif-mark-all" onClick={handleMarkAll} title="Marquer tout comme lu">
                      <CheckCheck size={13} /> Tout lire
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button className="notif-action-btn notif-delete-all" onClick={handleDeleteAll} title="Supprimer toutes les notifications">
                      <Trash2 size={13} /> Tout supprimer
                    </button>
                  )}
                </div>
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
                    <div className="notif-item-body">
                      <div className="notif-message">{n.message}</div>
                      <div className="notif-time">{new Date(n.createdAt).toLocaleString('fr-FR')}</div>
                    </div>
                    <button
                      className="notif-delete-one"
                      onClick={(e) => handleDeleteOne(e, n.id)}
                      title="Supprimer cette notification"
                    >
                      <Trash2 size={13} />
                    </button>
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
