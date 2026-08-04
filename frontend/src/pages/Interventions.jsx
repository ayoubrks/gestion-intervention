import React, { useEffect, useState, useContext } from 'react';
import interventionService from '../services/interventionService';
import equipmentService from '../services/equipmentService';
import userService from '../services/userService';
import sparePartService from '../services/sparePartService';
import { AuthContext } from '../context/AuthContext';
import { Plus, Clock, User, AlertTriangle, Play, CheckCircle, X, History, Wrench, Package, Ban, Info } from 'lucide-react';
import './Interventions.css';

const COLUMNS = [
  { id: 'Pending', label: 'En attente', color: 'var(--status-pending)' },
  { id: 'Assigned', label: 'Assigné', color: '#8b5cf6' },
  { id: 'InProgress', label: 'En cours', color: 'var(--status-inprogress)' },
  { id: 'Completed', label: 'Terminé', color: 'var(--status-completed)' },
  { id: 'Cancelled', label: 'Annulé', color: '#ef4444' }
];

const Interventions = () => {
  const { user } = useContext(AuthContext);
  const [interventions, setInterventions] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [allSpareParts, setAllSpareParts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConsumeSpareOpen, setIsConsumeSpareOpen] = useState(false);
  
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [usedParts, setUsedParts] = useState([]);

  // Form states
  const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'Normal', equipmentId: '' });
  const [assignForm, setAssignForm] = useState({ technicianId: '', scheduledDate: '' });
  const [completeForm, setCompleteForm] = useState({ report: '', actualDurationMinutes: 60 });
  const [cancelReason, setCancelReason] = useState('');
  const [consumeForm, setConsumeForm] = useState({ sparePartId: '', quantityConsumed: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invData, eqData, userData, partsData] = await Promise.all([
        interventionService.getAllInterventions(1, 100),
        equipmentService.getAllEquipments(1, 100),
        userService.getAllUsers(1, 100),
        sparePartService.getAllSpareParts(1, 100)
      ]);
      setInterventions(invData.items || (Array.isArray(invData) ? invData : []));
      setEquipments(eqData.items || (Array.isArray(eqData) ? eqData : []));
      
      const userList = userData.items || (Array.isArray(userData) ? userData : []);
      setTechnicians(userList.filter(u => u.roleName === 'Technician' || u.role === 'Technician'));
      setAllSpareParts(partsData.items || (Array.isArray(partsData) ? partsData : []));
    } catch (error) {
      console.error("Erreur de chargement", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await interventionService.createIntervention({
        ...createForm,
        equipmentId: parseInt(createForm.equipmentId)
      });
      setIsCreateOpen(false);
      setCreateForm({ title: '', description: '', priority: 'Normal', equipmentId: '' });
      fetchData();
    } catch (error) {
      alert("Erreur création: " + (error.response?.data?.message || error.message));
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      const formattedDate = assignForm.scheduledDate ? new Date(assignForm.scheduledDate).toISOString() : new Date().toISOString();
      await interventionService.assignTechnician(selectedIntervention.id, {
        technicianId: parseInt(assignForm.technicianId),
        scheduledDate: formattedDate
      });
      setIsAssignOpen(false);
      fetchData();
    } catch (error) {
      alert("Erreur assignation: " + (error.response?.data?.message || error.message));
    }
  };

  const handleStart = async (id) => {
    try {
      await interventionService.startIntervention(id);
      fetchData();
    } catch (error) {
      alert("Erreur démarrage: " + (error.response?.data?.message || error.message));
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await interventionService.completeIntervention(selectedIntervention.id, {
        report: completeForm.report,
        actualDurationMinutes: parseInt(completeForm.actualDurationMinutes)
      });
      setIsCompleteOpen(false);
      fetchData();
    } catch (error) {
      alert("Erreur complétion: " + (error.response?.data?.message || error.message));
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    try {
      await interventionService.cancelIntervention(selectedIntervention.id, cancelReason);
      setIsCancelOpen(false);
      setCancelReason('');
      fetchData();
    } catch (error) {
      alert("Erreur annulation: " + (error.response?.data?.message || error.message));
    }
  };

  const handleConsumeSparePart = async (e) => {
    e.preventDefault();
    try {
      await sparePartService.consumeSparePart(selectedIntervention.id, {
        sparePartId: parseInt(consumeForm.sparePartId),
        quantityConsumed: parseInt(consumeForm.quantityConsumed)
      });
      setIsConsumeSpareOpen(false);
      setConsumeForm({ sparePartId: '', quantityConsumed: 1 });
      alert("Pièce de rechange ajoutée à l'intervention !");
      if (selectedIntervention) {
        openDetailsModal(selectedIntervention);
      }
    } catch (error) {
      alert("Erreur consommation pièce: " + (error.response?.data?.message || error.message));
    }
  };

  const openDetailsModal = async (inv) => {
    setSelectedIntervention(inv);
    setIsDetailsOpen(true);
    try {
      const [hist, parts] = await Promise.all([
        interventionService.getInterventionHistory(inv.id),
        sparePartService.getSparePartsUsedInIntervention(inv.id)
      ]);
      setHistoryLogs(hist || []);
      setUsedParts(parts || []);
    } catch (err) {
      console.error("Erreur chargement détails:", err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Normal': return '#3b82f6';
      case 'Low': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="interventions-page flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h1>Interventions (Kanban)</h1>
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} />
            Créer une intervention
          </button>
        )}
      </div>

      <div className="kanban-board">
        {COLUMNS.map(column => (
          <div key={column.id} className="kanban-column glass-card">
            <div className="column-header" style={{ borderBottomColor: column.color }}>
              <h3>{column.label}</h3>
              <span className="badge" style={{ backgroundColor: `${column.color}20`, color: column.color }}>
                {interventions.filter(i => i.status === column.id).length}
              </span>
            </div>
            
            <div className="column-content">
              {loading ? (
                <div className="text-center text-muted p-4">Chargement...</div>
              ) : (
                interventions.filter(i => i.status === column.id).map(inv => (
                  <div key={inv.id} className="kanban-card">
                    <div className="card-priority" style={{ backgroundColor: getPriorityColor(inv.priority) }}></div>
                    <div className="flex justify-between items-start">
                      <h4>{inv.title}</h4>
                      <button className="icon-btn" title="Détails" onClick={() => openDetailsModal(inv)}>
                        <Info size={14} />
                      </button>
                    </div>
                    <p className="eq-name flex items-center gap-1"><Wrench size={12}/> {inv.equipmentName}</p>
                    {inv.technicianName && (
                      <p className="tech-name flex items-center gap-1"><User size={12}/> {inv.technicianName}</p>
                    )}
                    
                    {/* Action buttons based on status & role */}
                    <div className="card-actions flex flex-wrap gap-2 mt-3">
                      {column.id === 'Pending' && (user?.role === 'Admin' || user?.role === 'Manager') && (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedIntervention(inv); setIsAssignOpen(true); }}>
                          Assigner
                        </button>
                      )}
                      
                      {column.id === 'Assigned' && (user?.role === 'Admin' || user?.role === 'Manager' || user?.id === inv.technicianId) && (
                        <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => handleStart(inv.id)}>
                          <Play size={14}/> Démarrer
                        </button>
                      )}

                      {column.id === 'InProgress' && (user?.role === 'Admin' || user?.role === 'Manager' || user?.id === inv.technicianId) && (
                        <>
                          <button className="btn btn-secondary btn-sm flex items-center gap-1" title="Consommer pièce" onClick={() => { setSelectedIntervention(inv); setIsConsumeSpareOpen(true); }}>
                            <Package size={14}/> Pièce
                          </button>
                          <button className="btn btn-success btn-sm flex items-center gap-1" onClick={() => { setSelectedIntervention(inv); setIsCompleteOpen(true); }}>
                            <CheckCircle size={14}/> Terminer
                          </button>
                        </>
                      )}

                      {(column.id === 'Pending' || column.id === 'Assigned' || column.id === 'InProgress') && (user?.role === 'Admin' || user?.role === 'Manager') && (
                        <button className="btn btn-sm btn-danger-icon" title="Annuler" onClick={() => { setSelectedIntervention(inv); setIsCancelOpen(true); }}>
                          <Ban size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal CREATE */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in">
            <div className="modal-header flex justify-between items-center mb-4">
              <h3>Nouvelle Intervention</h3>
              <button className="icon-btn" onClick={() => setIsCreateOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group mb-3">
                <label className="form-label">Titre</label>
                <input required type="text" className="form-input" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} placeholder="ex: Panne moteur principal" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Description</label>
                <textarea required className="form-input" rows="3" value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} placeholder="Décrivez le problème constaté..."></textarea>
              </div>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label className="form-label">Priorité</label>
                  <select className="form-input" value={createForm.priority} onChange={e => setCreateForm({...createForm, priority: e.target.value})}>
                    <option value="Low">Basse</option>
                    <option value="Normal">Normale</option>
                    <option value="High">Haute</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Équipement</label>
                  <select required className="form-input" value={createForm.equipmentId} onChange={e => setCreateForm({...createForm, equipmentId: e.target.value})}>
                    <option value="" disabled>Sélectionner...</option>
                    {equipments.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer flex justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ASSIGN */}
      {isAssignOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in">
            <div className="modal-header flex justify-between items-center mb-4">
              <h3>Assigner un technicien ({selectedIntervention.title})</h3>
              <button className="icon-btn" onClick={() => setIsAssignOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="form-group mb-3">
                <label className="form-label">Technicien</label>
                <select required className="form-input" value={assignForm.technicianId} onChange={e => setAssignForm({...assignForm, technicianId: e.target.value})}>
                  <option value="" disabled>Sélectionner...</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.username} ({t.email})</option>)}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Date prévue</label>
                <input required type="datetime-local" className="form-input" value={assignForm.scheduledDate} onChange={e => setAssignForm({...assignForm, scheduledDate: e.target.value})} />
              </div>
              <div className="modal-footer flex justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAssignOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Assigner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal COMPLETE */}
      {isCompleteOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in">
            <div className="modal-header flex justify-between items-center mb-4">
              <h3>Clôturer l'intervention</h3>
              <button className="icon-btn" onClick={() => setIsCompleteOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleComplete}>
              <div className="form-group mb-3">
                <label className="form-label">Rapport final</label>
                <textarea required className="form-input" rows="4" value={completeForm.report} onChange={e => setCompleteForm({...completeForm, report: e.target.value})} placeholder="Décrivez les actions réalisées..."></textarea>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Durée réelle (minutes)</label>
                <input required type="number" min="1" className="form-input" value={completeForm.actualDurationMinutes} onChange={e => setCompleteForm({...completeForm, actualDurationMinutes: e.target.value})} />
              </div>
              <div className="modal-footer flex justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCompleteOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-success">Clôturer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal CANCEL */}
      {isCancelOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header flex justify-between items-center mb-4">
              <h3>Annuler l'intervention</h3>
              <button className="icon-btn" onClick={() => setIsCancelOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCancel}>
              <div className="form-group mb-4">
                <label className="form-label">Motif d'annulation</label>
                <textarea required className="form-input" rows="3" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Raison de l'annulation..."></textarea>
              </div>
              <div className="modal-footer flex justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCancelOpen(false)}>Fermer</button>
                <button type="submit" className="btn btn-danger-icon" style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', borderRadius: '8px' }}>Confirmer l'annulation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal CONSUME SPARE PART */}
      {isConsumeSpareOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header flex justify-between items-center mb-4">
              <h3>Utiliser une pièce de rechange</h3>
              <button className="icon-btn" onClick={() => setIsConsumeSpareOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleConsumeSparePart}>
              <div className="form-group mb-3">
                <label className="form-label">Pièce de rechange</label>
                <select required className="form-input" value={consumeForm.sparePartId} onChange={e => setConsumeForm({...consumeForm, sparePartId: e.target.value})}>
                  <option value="" disabled>Sélectionner la pièce...</option>
                  {allSpareParts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Quantité consommée</label>
                <input required type="number" min="1" className="form-input" value={consumeForm.quantityConsumed} onChange={e => setConsumeForm({...consumeForm, quantityConsumed: e.target.value})} />
              </div>
              <div className="modal-footer flex justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setIsConsumeSpareOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal DETAILS & HISTORY */}
      {isDetailsOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header flex justify-between items-center mb-4">
              <h3>Détails de l'Intervention #{selectedIntervention.id}</h3>
              <button className="icon-btn" onClick={() => setIsDetailsOpen(false)}><X size={20} /></button>
            </div>
            <div className="details-body">
              <h4>{selectedIntervention.title}</h4>
              <p className="text-muted mb-3">{selectedIntervention.description}</p>
              
              <div className="grid grid-2 gap-4 mb-4 glass-card p-3">
                <div><strong>Équipement:</strong> {selectedIntervention.equipmentName}</div>
                <div><strong>Technicien:</strong> {selectedIntervention.technicianName || 'Non assigné'}</div>
                <div><strong>Statut:</strong> <span className="badge">{selectedIntervention.status}</span></div>
                <div><strong>Priorité:</strong> <span style={{ color: getPriorityColor(selectedIntervention.priority) }}>{selectedIntervention.priority}</span></div>
              </div>

              {usedParts.length > 0 && (
                <div className="mb-4">
                  <h5><Package size={16}/> Pièces utilisées ({usedParts.length}) :</h5>
                  <ul style={{ paddingLeft: '20px' }}>
                    {usedParts.map((p, idx) => (
                      <li key={idx}>{p.sparePartName || p.name} - Quantité: {p.quantityConsumed || p.quantity}</li>
                    ))}
                  </ul>
                </div>
              )}

              {historyLogs.length > 0 && (
                <div>
                  <h5><History size={16}/> Historique des événements :</h5>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                    {historyLogs.map((log, idx) => (
                      <div key={idx} style={{ fontSize: '0.85rem', marginBottom: '6px', borderBottom: '1px dotted var(--glass-border)', paddingBottom: '4px' }}>
                        <span className="text-muted">{new Date(log.timestamp || log.createdAt).toLocaleString()} :</span> <strong>{log.action || log.status}</strong> - {log.details || log.comment}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Interventions;
