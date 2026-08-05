import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Shield, Bell, Sliders, Server, Save, Key, CheckCircle, Moon, Sun, DollarSign, Database, Activity } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    currency: '€',
    dateFormat: 'DD/MM/YYYY',
    pageSize: '20'
  });
  const [notifications, setNotifications] = useState({
    emailLowStock: true,
    preventiveOverdue: true,
    newInterventionAssigned: true,
    dailyReport: false
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="settings-page">
      <div className="flex justify-between items-center mb-2">
        <h1>Paramètres du Système</h1>
      </div>

      {saveSuccess && (
        <div className="card p-3 flex items-center gap-2 animate-fade-in" style={{ borderLeft: '4px solid var(--green)', background: 'var(--green-subtle)', color: 'var(--green)' }}>
          <CheckCircle size={20} />
          <strong>Paramètres enregistrés avec succès !</strong>
        </div>
      )}

      <div className="settings-grid">
        {/* Navigation gauche */}
        <div className="card settings-nav">
          <button 
            className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profil & Sécurité
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Sliders size={18} /> Préférences Générale
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> Alertes & Notifications
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Server size={18} /> Système & Statut
          </button>
        </div>

        {/* Contenu principal */}
        <div className="card settings-content-card">
          {activeTab === 'profile' && (
            <div>
              <h3 className="settings-section-title flex items-center gap-2"><User size={20}/> Informations de Profil</h3>
              
              <div className="card p-4 mb-4 flex items-center gap-4">
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                  {user?.username ? user.username[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{user?.username || 'Utilisateur'}</h3>
                  <p className="text-muted" style={{ margin: '4px 0' }}>{user?.email || 'email@domaine.com'}</p>
                  <span className="badge badge-inprogress"><Shield size={12}/> Rôle: {user?.role || 'Technician'}</span>
                </div>
              </div>

              <h3 className="settings-section-title flex items-center gap-2 mt-6"><Key size={20}/> Changer le mot de passe</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group mb-3">
                  <label className="form-label">Mot de passe actuel</label>
                  <input required type="password" className="form-input" value={passwordForm.oldPassword} onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})} placeholder="••••••••" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Nouveau mot de passe</label>
                  <input required type="password" className="form-input" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} placeholder="••••••••" />
                </div>
                <div className="form-group mb-4">
                  <label className="form-label">Confirmer le nouveau mot de passe</label>
                  <input required type="password" className="form-input" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} placeholder="••••••••" />
                </div>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Save size={16}/> Mettre à jour le mot de passe
                </button>
              </form>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <h3 className="settings-section-title flex items-center gap-2"><Sliders size={20}/> Préférences d'affichage</h3>
              <form onSubmit={handleSavePreferences}>
                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Thème visuel</h4>
                    <p>Mode sombre moderne glassmorphism par défaut</p>
                  </div>
                  <select className="form-input" style={{ width: '160px' }} value={preferences.theme} onChange={e => setPreferences({...preferences, theme: e.target.value})}>
                    <option value="dark">Sombre (Glass)</option>
                    <option value="light">Clair</option>
                  </select>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Devise monétaire</h4>
                    <p>Utilisée pour le coût des pièces de rechange et interventions</p>
                  </div>
                  <select className="form-input" style={{ width: '160px' }} value={preferences.currency} onChange={e => setPreferences({...preferences, currency: e.target.value})}>
                    <option value="€">Euros (€)</option>
                    <option value="$">Dollars ($)</option>
                    <option value="TND">Dinar TND</option>
                    <option value="DZD">Dinar DZD</option>
                  </select>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <h4>Format des dates</h4>
                    <p>Format d'affichage des échéances et rapports</p>
                  </div>
                  <select className="form-input" style={{ width: '160px' }} value={preferences.dateFormat} onChange={e => setPreferences({...preferences, dateFormat: e.target.value})}>
                    <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                    <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                  </select>
                </div>

                <div className="setting-row mb-4">
                  <div className="setting-info">
                    <h4>Éléments par page</h4>
                    <p>Nombre d'éléments chargés dans les tableaux paginés</p>
                  </div>
                  <select className="form-input" style={{ width: '160px' }} value={preferences.pageSize} onChange={e => setPreferences({...preferences, pageSize: e.target.value})}>
                    <option value="10">10 éléments</option>
                    <option value="20">20 éléments</option>
                    <option value="50">50 éléments</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary flex items-center gap-2 mt-4">
                  <Save size={16}/> Enregistrer les préférences
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 className="settings-section-title flex items-center gap-2"><Bell size={20}/> Réglage des Alertes Automatiques</h3>
              
              <div className="setting-row">
                <div className="setting-info">
                  <h4>Alerte de Stock Bas (Pièces)</h4>
                  <p>Avertir immédiatement lorsque le stock franchit le seuil critique</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifications.emailLowStock} onChange={e => setNotifications({...notifications, emailLowStock: e.target.checked})} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>Rappels de Maintenance Préventive</h4>
                  <p>Notifier lorsque des opérations préventives arrivent à échéance</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifications.preventiveOverdue} onChange={e => setNotifications({...notifications, preventiveOverdue: e.target.checked})} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <h4>Affectation d'Interventions</h4>
                  <p>Notifier le technicien dès qu'une intervention lui est assignée</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifications.newInterventionAssigned} onChange={e => setNotifications({...notifications, newInterventionAssigned: e.target.checked})} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-row mb-4">
                <div className="setting-info">
                  <h4>Rapport quotidien de synthèse</h4>
                  <p>Recevoir un récapitulatif chaque matin sur l'état du parc d'équipements</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifications.dailyReport} onChange={e => setNotifications({...notifications, dailyReport: e.target.checked})} />
                  <span className="slider"></span>
                </label>
              </div>

              <button type="button" onClick={handleSavePreferences} className="btn btn-primary flex items-center gap-2 mt-4">
                <Save size={16}/> Enregistrer les réglages
              </button>
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <h3 className="settings-section-title flex items-center gap-2"><Server size={20}/> Informations & Diagnostic Système</h3>
              
              <div className="grid grid-2 gap-4 mb-4">
                <div className="card p-3">
                  <div className="flex items-center gap-2 text-muted mb-1"><Activity size={16}/> API Backend (.NET 10.0)</div>
                  <div style={{ color: 'var(--green)', fontWeight: 'bold' }}>Connecté & Opérationnel</div>
                </div>

                <div className="card p-3">
                  <div className="flex items-center gap-2 text-muted mb-1"><Database size={16}/> Base de Données (SQLite)</div>
                  <div style={{ color: 'var(--green)', fontWeight: 'bold' }}>SmartMaintenanceDb.db (Opérationnel)</div>
                </div>

                <div className="card p-3">
                  <div className="flex items-center gap-2 text-muted mb-1"><Sliders size={16}/> Version Application</div>
                  <div style={{ fontWeight: 'bold' }}>SmartMaintenanceAI v2.4.0</div>
                </div>

                <div className="card p-3">
                  <div className="flex items-center gap-2 text-muted mb-1"><Shield size={16}/> Environnement</div>
                  <div style={{ fontWeight: 'bold' }}>Développement / Local</div>
                </div>
              </div>

              <div className="card p-3 mt-4">
                <h4>Modules Actifs :</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="badge badge-completed">Interventions (Kanban)</span>
                  <span className="badge badge-completed">Équipements & Catégories</span>
                  <span className="badge badge-completed">Maintenance Préventive</span>
                  <span className="badge badge-completed">Pièces de Rechange</span>
                  <span className="badge badge-completed">Gestion Utilisateurs</span>
                  <span className="badge badge-completed">Paramètres Système</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
