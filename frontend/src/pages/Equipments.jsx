import React, { useEffect, useState, useContext } from 'react';
import equipmentService from '../services/equipmentService';
import { AuthContext } from '../context/AuthContext';
import { Wrench, Plus, Edit, Trash2, Search, Filter, AlertCircle, X, Layers, FolderPlus } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './Equipments.css';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Hydraulique' },
  { id: 2, name: 'Électrique' },
  { id: 3, name: 'Mécanique' },
  { id: 4, name: 'Pneumatique' },
  { id: 5, name: 'Général' }
];

const Equipments = () => {
  const { user } = useContext(AuthContext);
  const [equipments, setEquipments] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Equipment Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Equipment Form State
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    status: 'Active',
    categoryId: 1
  });

  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqData, catData] = await Promise.all([
        equipmentService.getAllEquipments(1, 100, searchTerm, selectedCategory),
        equipmentService.getAllCategories()
      ]);
      setEquipments(eqData.items || (Array.isArray(eqData) ? eqData : []));
      
      const loadedCats = Array.isArray(catData) ? catData : (catData?.items || []);
      if (loadedCats && loadedCats.length > 0) {
        setCategories(loadedCats);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (equipment = null) => {
    const currentCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const defaultCatId = currentCats[0]?.id || 1;

    if (equipment) {
      setEditingEquipment(equipment);
      setFormData({
        name: equipment.name,
        serialNumber: equipment.serialNumber,
        status: equipment.status || 'Active',
        categoryId: equipment.categoryId || defaultCatId
      });
    } else {
      setEditingEquipment(null);
      setFormData({
        name: '',
        serialNumber: '',
        status: 'Active',
        categoryId: defaultCatId
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEquipment(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        serialNumber: formData.serialNumber,
        status: formData.status,
        categoryId: parseInt(formData.categoryId) || 1
      };

      if (editingEquipment) {
        await equipmentService.updateEquipment(editingEquipment.id, payload);
      } else {
        await equipmentService.createEquipment(payload);
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert("Erreur lors de la sauvegarde: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = (id) => {
    setConfirmTitle("Supprimer l'équipement");
    setConfirmMessage(<>Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est <strong>irréversible</strong>.</>);
    setConfirmAction(() => async () => {
      setConfirmOpen(false);
      try {
        await equipmentService.deleteEquipment(id);
        fetchData();
      } catch (error) {
        alert("Impossible de supprimer l'équipement. Il est peut-être lié à des interventions.");
      }
    });
    setConfirmOpen(true);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await equipmentService.createCategory({
        name: newCategoryName,
        description: newCategoryDesc
      });
      setNewCategoryName('');
      setNewCategoryDesc('');
      const updatedCats = await equipmentService.getAllCategories();
      const list = Array.isArray(updatedCats) ? updatedCats : (updatedCats?.items || []);
      setCategories(list.length > 0 ? list : DEFAULT_CATEGORIES);
      alert("Catégorie créée avec succès !");
    } catch (error) {
      alert("Erreur création catégorie: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCategory = (catId, catName) => {
    setConfirmTitle("Supprimer la catégorie");
    setConfirmMessage(<>Voulez-vous supprimer la catégorie <strong>"{catName}"</strong> ?</>);
    setConfirmAction(() => async () => {
      setConfirmOpen(false);
      try {
        await equipmentService.deleteCategory(catId);
        const updatedCats = await equipmentService.getAllCategories();
        const list = Array.isArray(updatedCats) ? updatedCats : (updatedCats?.items || []);
        setCategories(list.length > 0 ? list : DEFAULT_CATEGORIES);
      } catch (error) {
        alert("Impossible de supprimer cette catégorie car elle contient des équipements.");
      }
    });
    setConfirmOpen(true);
  };

  const activeCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <div className="equipments-page">
      <div className="flex justify-between items-center mb-4">
        <h1>Gestion des Équipements</h1>
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(true)}>
              <Layers size={18} />
              Gérer les Catégories
            </button>
            <button className="btn btn-primary" onClick={() => openModal()}>
              <Plus size={18} />
              Ajouter un équipement
            </button>
          </div>
        )}
      </div>

      <div className="card mb-4 filter-bar flex gap-4">
        <div className="input-with-icon" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Rechercher par nom ou numéro de série..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="input-with-icon" style={{ width: '250px' }}>
          <Filter size={18} className="input-icon" />
          <select 
            className="form-input select-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {activeCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="equipment-grid">
        {loading ? (
          <div className="loading-state">Chargement des équipements...</div>
        ) : equipments.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} color="var(--text-muted)" />
            <p>Aucun équipement trouvé</p>
          </div>
        ) : (
          equipments.map(eq => (
            <div key={eq.id} className="card equipment-card">
              <div className="eq-card-header">
                <div className="eq-icon">
                  <Wrench size={24} />
                </div>
                <div className="eq-status">
                  <span className={`badge ${eq.status === 'Active' || eq.status === 'Operational' ? 'badge-completed' : eq.status === 'Maintenance' ? 'badge-inprogress' : 'badge-cancelled'}`}>
                    {eq.status === 'Active' ? 'Actif' : eq.status === 'Maintenance' ? 'Maintenance' : 'Hors Service'}
                  </span>
                </div>
              </div>
              <h3 className="eq-title">{eq.name}</h3>
              <p className="eq-serial">SN: {eq.serialNumber}</p>
              <div className="eq-category">
                {eq.categoryName || 'Général'}
              </div>
              
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <div className="eq-actions flex gap-2 mt-3">
                  <button className="icon-btn" title="Modifier" onClick={() => openModal(eq)}>
                    <Edit size={16} />
                  </button>
                  {user?.role === 'Admin' && (
                    <button className="icon-btn btn-danger-icon" title="Supprimer" onClick={() => handleDelete(eq.id)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit Equipment */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>{editingEquipment ? 'Modifier l\'équipement' : 'Nouvel Équipement'}</h3>
              <button className="modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Nom de l'équipement</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="ex: Pompe hydraulique P-200"
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Numéro de série</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  required
                  placeholder="ex: SN-987654"
                />
              </div>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label className="form-label">Catégorie</label>
                  <select 
                    className="form-input"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    required
                  >
                    <option value="" disabled>Sélectionner une catégorie...</option>
                    {activeCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Statut</label>
                  <select 
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Active">Actif</option>
                    <option value="Maintenance">En Maintenance</option>
                    <option value="Out of Order">Hors Service</option>
                  </select>
                </div>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn btn-primary">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Manage Categories */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>Catégories d'Équipements</h3>
              <button className="modal-close" onClick={() => setIsCategoryModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateCategory} className="mb-4 card p-4">
                <h4 className="mb-3 flex items-center gap-2"><FolderPlus size={16}/> Nouvelle Catégorie</h4>
              <div className="form-group mb-2">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nom de la catégorie (ex: Électrique)..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group mb-2">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Description (optionnel)..."
                  value={newCategoryDesc}
                  onChange={e => setNewCategoryDesc(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm w-full mt-2">Ajouter la catégorie</button>
            </form>

              <div className="category-list mt-2">
                <h4 className="mb-3">Catégories existantes :</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {activeCategories.length === 0 ? (
                    <p className="text-muted p-2">Aucune catégorie</p>
                  ) : (
                    activeCategories.map(cat => (
                      <div key={cat.id} className="category-list-item">
                        <div>
                          <div className="cat-name">{cat.name}</div>
                          {cat.description && <div className="cat-desc">{cat.description}</div>}
                        </div>
                        {user?.role === 'Admin' && (
                          <button className="icon-btn btn-danger-icon" onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onConfirm={confirmAction}
        onCancel={() => setConfirmOpen(false)}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default Equipments;
