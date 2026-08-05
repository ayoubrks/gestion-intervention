import React, { useEffect, useState, useContext } from 'react';
import sparePartService from '../services/sparePartService';
import { AuthContext } from '../context/AuthContext';
import { Package, Plus, Edit, Trash2, Search, AlertTriangle, X, RefreshCw, History } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './SpareParts.css';

const SpareParts = () => {
  const { user } = useContext(AuthContext);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  // Forms
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    description: '',
    unitCost: 0,
    stockQuantity: 0,
    minimumThreshold: 5
  });
  const [adjustQty, setAdjustQty] = useState(0);

  useEffect(() => {
    fetchParts();
  }, [searchTerm, lowStockOnly]);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const data = await sparePartService.getAllSpareParts(1, 100, searchTerm, lowStockOnly);
      setParts(data.items || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error("Erreur de chargement des pièces:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (part = null) => {
    if (part) {
      setEditingPart(part);
      setFormData({
        name: part.name,
        reference: part.reference,
        description: part.description || '',
        unitCost: part.unitCost,
        stockQuantity: part.stockQuantity,
        minimumThreshold: part.minimumThreshold
      });
    } else {
      setEditingPart(null);
      setFormData({
        name: '',
        reference: '',
        description: '',
        unitCost: 10,
        stockQuantity: 10,
        minimumThreshold: 5
      });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        reference: formData.reference,
        description: formData.description,
        unitCost: parseFloat(formData.unitCost),
        stockQuantity: parseInt(formData.stockQuantity),
        minimumThreshold: parseInt(formData.minimumThreshold)
      };

      if (editingPart) {
        await sparePartService.updateSparePart(editingPart.id, payload);
      } else {
        await sparePartService.createSparePart(payload);
      }
      setIsModalOpen(false);
      fetchParts();
    } catch (error) {
      alert("Erreur de sauvegarde: " + (error.response?.data?.message || error.message));
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      await sparePartService.adjustStock(selectedPart.id, parseInt(adjustQty));
      setIsAdjustOpen(false);
      setAdjustQty(0);
      fetchParts();
    } catch (error) {
      alert("Erreur d'ajustement: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setConfirmOpen(false);
    try {
      await sparePartService.deleteSparePart(confirmDeleteId);
      fetchParts();
    } catch (error) {
      alert("Impossible de supprimer cette pièce. Elle est peut-être liée à des interventions.");
    }
  };

  const lowStockCount = parts.filter(p => p.isLowStock || p.stockQuantity <= p.minimumThreshold).length;

  return (
    <div className="spare-parts-page">
      <div className="flex justify-between items-center mb-4">
        <h1>Pièces de Rechange</h1>
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            Ajouter une pièce
          </button>
        )}
      </div>

      {lowStockCount > 0 && !lowStockOnly && (
        <div className="card mb-4 p-3 flex justify-between items-center" style={{ borderLeft: '4px solid var(--red)', background: 'var(--red-subtle)' }}>
          <div className="flex items-center gap-2" style={{ color: '#ef4444' }}>
            <AlertTriangle size={20} />
            <strong>Alerte Stock Bas : {lowStockCount} pièce(s) nécessite(nt) un réapprovisionnement !</strong>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setLowStockOnly(true)}>
            Filtrer ces pièces
          </button>
        </div>
      )}

      <div className="card mb-4 filter-bar flex justify-between items-center gap-4">
        <div className="input-with-icon" style={{ flex: 1 }}>
          <Search size={18} className="input-icon" />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Rechercher par nom ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-secondary checkbox-label style-pointer" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input 
            type="checkbox" 
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Alerte Stock Bas uniquement
        </label>
      </div>

      <div className="card table-container" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="app-table">
          <thead>
            <tr>
              <th style={{ padding: '16px' }}>Référence</th>
              <th style={{ padding: '16px' }}>Désignation</th>
              <th style={{ padding: '16px' }}>Coût Unitaire</th>
              <th style={{ padding: '16px' }}>Stock Actuel</th>
              <th style={{ padding: '16px' }}>Seuil Min</th>
              <th style={{ padding: '16px' }}>Status Stock</th>
              <th style={{ padding: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center p-4">Chargement...</td></tr>
            ) : parts.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-4">Aucune pièce trouvée</td></tr>
            ) : (
              parts.map(part => {
                const isLow = part.isLowStock || part.stockQuantity <= part.minimumThreshold;
                return (
                  <tr key={part.id} style={{ background: isLow ? 'var(--red-subtle)' : 'transparent' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{part.reference}</td>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div><strong>{part.name}</strong></div>
                        <small className="text-muted">{part.description}</small>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>{part.unitCost ? part.unitCost.toFixed(2) : '0.00'} €</td>
                    <td style={{ padding: '16px', fontWeight: 600, fontSize: '1.05rem' }}>{part.stockQuantity}</td>
                    <td style={{ padding: '16px' }}>{part.minimumThreshold}</td>
                    <td style={{ padding: '16px' }}>
                      {isLow ? (
                        <span className="badge badge-cancelled flex items-center gap-1">
                          <AlertTriangle size={12} /> Stock Bas
                        </span>
                      ) : (
                        <span className="badge badge-completed">Correct</span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div className="flex gap-2">
                        {(user?.role === 'Admin' || user?.role === 'Manager') && (
                          <>
                            <button className="icon-btn" title="Ajuster le Stock" onClick={() => { setSelectedPart(part); setAdjustQty(0); setIsAdjustOpen(true); }}>
                              <RefreshCw size={14} />
                            </button>
                            <button className="icon-btn" title="Modifier" onClick={() => openModal(part)}>
                              <Edit size={14} />
                            </button>
                          </>
                        )}
                        {user?.role === 'Admin' && (
                          <button className="icon-btn btn-danger-icon" title="Supprimer" onClick={() => handleDelete(part.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>{editingPart ? 'Modifier la pièce' : 'Nouvelle Pièce de Rechange'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Désignation / Nom</label>
                <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ex: Joint d'étanchéité 50mm" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Référence</label>
                <input required type="text" className="form-input" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} placeholder="ex: REF-JNT-05" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Détails techniques..."></textarea>
              </div>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label className="form-label">Coût Unitaire (€)</label>
                  <input required type="number" step="0.01" min="0.01" className="form-input" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Stock Initial</label>
                  <input required type="number" min="0" className="form-input" disabled={!!editingPart} value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Seuil d'alerte</label>
                  <input required type="number" min="0" className="form-input" value={formData.minimumThreshold} onChange={e => setFormData({...formData, minimumThreshold: e.target.value})} />
                </div>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adjust Stock */}
      {isAdjustOpen && selectedPart && (
        <div className="modal-overlay">
          <div className="modal-panel modal-panel-sm animate-fade-in">
            <div className="modal-header">
              <h3>Ajuster le Stock</h3>
              <button className="modal-close" onClick={() => setIsAdjustOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjustStock}>
              <div className="modal-body">
              <div className="form-group text-center mb-4">
                <h4>{selectedPart.name}</h4>
                <p className="text-muted">Référence: {selectedPart.reference}</p>
                <p style={{ fontSize: '1.25rem', marginTop: '10px' }}>Stock Actuel: <strong>{selectedPart.stockQuantity}</strong></p>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Ajustement (ex: +5 pour un ajout, -3 pour un retrait)</label>
                <input required type="number" className="form-input text-center" style={{ fontSize: '1.5rem', fontWeight: 'bold' }} value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Appliquer</button>
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
        title="Supprimer la pièce de rechange"
        message={<>Voulez-vous vraiment supprimer cette pièce de rechange ? Cette action est <strong>irréversible</strong>.</>}
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default SpareParts;
