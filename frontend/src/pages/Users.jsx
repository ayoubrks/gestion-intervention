import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';
import { UserPlus, Shield, User, Edit, Trash2, X, Search, Filter } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const Users = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState({ id: null, name: '' });

  // Form states
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', roleId: 3 });
  const [editForm, setEditForm] = useState({ username: '', email: '', password: '', roleId: 3 });

  useEffect(() => {
    fetchUsersAndRoles();
  }, [searchTerm, selectedRole]);

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(1, 100, searchTerm, selectedRole),
        userService.getRoles()
      ]);
      setUsers(usersData.items || (Array.isArray(usersData) ? usersData : []));
      setRoles(rolesData || []);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await userService.createUser({
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        roleId: parseInt(createForm.roleId)
      });
      setIsCreateModalOpen(false);
      setCreateForm({ username: '', email: '', password: '', roleId: 3 });
      fetchUsersAndRoles();
    } catch (err) {
      alert("Erreur lors de la création: " + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditForm({
      username: u.username,
      email: u.email,
      password: '',
      roleId: u.roleId || (roles.find(r => r.name === u.roleName)?.id || 3)
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: editForm.username,
        email: editForm.email,
        roleId: parseInt(editForm.roleId)
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      await userService.updateUser(editingUser.id, payload);
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsersAndRoles();
    } catch (err) {
      alert("Erreur lors de la modification: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (id, name) => {
    setConfirmTarget({ id, name });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setConfirmOpen(false);
    try {
      await userService.deleteUser(confirmTarget.id);
      fetchUsersAndRoles();
    } catch (err) {
      alert("Erreur lors de la suppression: " + (err.response?.data?.message || err.message));
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="glass-card text-center" style={{ padding: '60px' }}>
        <Shield size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
        <h2>Accès Refusé</h2>
        <p className="text-muted">Seuls les administrateurs peuvent accéder à la gestion des utilisateurs.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Gestion des Utilisateurs</h1>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus size={18} />
          Nouvel Utilisateur
        </button>
      </div>

      <div className="card mb-4 filter-bar flex gap-4">
        <div className="input-with-icon" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Rechercher par nom d'utilisateur ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="input-with-icon" style={{ width: '220px' }}>
          <Filter size={18} className="input-icon" />
          <select 
            className="form-input select-input"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">Tous les rôles</option>
            {roles.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="login-error mb-4">{error}</div>}

      <div className="card table-container" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="app-table">
          <thead>
            <tr>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500 }}>Nom d'utilisateur</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500 }}>Rôle</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>Chargement...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>Aucun utilisateur trouvé</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding: '16px 24px' }}>
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16}/></div>
                      <strong>{u.username}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className={`badge ${u.roleName === 'Admin' ? 'badge-cancelled' : u.roleName === 'Manager' ? 'badge-inprogress' : 'badge-completed'}`}>
                      {u.roleName}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div className="flex gap-2">
                      <button className="icon-btn" title="Modifier" onClick={() => openEditModal(u)} style={{ width: '32px', height: '32px' }}><Edit size={14} /></button>
                      <button className="icon-btn" title="Supprimer" onClick={() => handleDelete(u.id, u.username)} style={{ width: '32px', height: '32px', color: '#ef4444' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CREATE USER */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>Créer un Utilisateur</h3>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Nom d'utilisateur</label>
                <input required type="text" className="form-input" value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} placeholder="ex: jdupont" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Email</label>
                <input required type="email" className="form-input" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} placeholder="ex: jdupont@entreprise.com" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Mot de passe</label>
                <input required type="password" className="form-input" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} placeholder="Mot de passe sécurisé..." />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Rôle</label>
                <select className="form-input" value={createForm.roleId} onChange={e => setCreateForm({...createForm, roleId: e.target.value})}>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal EDIT USER */}
      {isEditModalOpen && editingUser && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>Modifier l'utilisateur ({editingUser.username})</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Nom d'utilisateur</label>
                <input required type="text" className="form-input" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Email</label>
                <input required type="email" className="form-input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Nouveau mot de passe (laisser vide pour ne pas modifier)</label>
                <input type="password" className="form-input" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} placeholder="Optionnel..." />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Rôle</label>
                <select className="form-input" value={editForm.roleId} onChange={e => setEditForm({...editForm, roleId: e.target.value})}>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        title="Supprimer l'utilisateur"
        message={<>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>"{confirmTarget.name}"</strong> ? Cette action est irréversible.</>}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default Users;
