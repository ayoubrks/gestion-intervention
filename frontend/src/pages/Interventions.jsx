import React, { useEffect, useState, useContext } from 'react';
import interventionService from '../services/interventionService';
import equipmentService from '../services/equipmentService';
import userService from '../services/userService';
import sparePartService from '../services/sparePartService';
import { AuthContext } from '../context/AuthContext';
import {
  Plus, Wrench, User, Play, CheckCircle, X,
  History, Package, Ban, Info, Inbox, RefreshCw, ClipboardCheck
} from 'lucide-react';
import './Interventions.css';

const COLUMNS = [
  { id: 'Pending',    label: 'En attente', dotClass: 'status-dot-neutral', emptyIcon: <Inbox size={28}/>, emptyText: 'Aucune intervention en attente.' },
  { id: 'Assigned',  label: 'Assigné',    dotClass: 'status-dot-purple',  emptyIcon: <User size={28}/>, emptyText: 'Aucune intervention assignée.' },
  { id: 'InProgress',label: 'En cours',   dotClass: 'status-dot-accent',  emptyIcon: <RefreshCw size={28}/>, emptyText: 'Aucune intervention en cours.' },
  { id: 'Completed', label: 'Terminé',    dotClass: 'status-dot-success', emptyIcon: <ClipboardCheck size={28}/>, emptyText: 'Aucune intervention terminée.' },
  { id: 'Cancelled', label: 'Annulé',     dotClass: 'status-dot-error',   emptyIcon: <Ban size={28}/>, emptyText: 'Aucune intervention annulée.' },
];

const PRIORITY_BADGE = {
  High:   { label: 'Haute',   className: 'card-badge card-badge-high' },
  Normal: { label: 'Normale', className: 'card-badge card-badge-normal' },
  Low:    { label: 'Basse',   className: 'card-badge card-badge-low' },
};

const PRIORITY_COLOR = {
  High: 'var(--red)', Normal: 'var(--blue)', Low: 'var(--green)',
};

const Interventions = () => {
  const { user } = useContext(AuthContext);
  const [interventions, setInterventions] = useState([]);
  const [equipments, setEquipments]     = useState([]);
  const [technicians, setTechnicians]   = useState([]);
  const [allSpareParts, setAllSpareParts] = useState([]);
  const [loading, setLoading]           = useState(true);

  const [isCreateOpen, setIsCreateOpen]           = useState(false);
  const [isAssignOpen, setIsAssignOpen]           = useState(false);
  const [isCompleteOpen, setIsCompleteOpen]       = useState(false);
  const [isCancelOpen, setIsCancelOpen]           = useState(false);
  const [isDetailsOpen, setIsDetailsOpen]         = useState(false);
  const [isConsumeSpareOpen, setIsConsumeSpareOpen] = useState(false);

  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [usedParts, setUsedParts]     = useState([]);

  const [createForm, setCreateForm]   = useState({ title: '', description: '', priority: 'Normal', equipmentId: '' });
  const [assignForm, setAssignForm]   = useState({ technicianId: '', scheduledDate: '' });
  const [completeForm, setCompleteForm] = useState({ report: '', actualDurationMinutes: 60 });
  const [cancelReason, setCancelReason] = useState('');
  const [consumeForm, setConsumeForm] = useState({ sparePartId: '', quantityConsumed: 1 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invData, eqData, userData, partsData] = await Promise.all([
        interventionService.getAllInterventions(1, 100).catch(() => ({ items: [] })),
        equipmentService.getAllEquipments(1, 100).catch(() => ({ items: [] })),
        userService.getAllUsers(1, 100).catch(() => ({ items: [] })),
        sparePartService.getAllSpareParts(1, 100).catch(() => ({ items: [] }))
      ]);
      setInterventions(invData.items || (Array.isArray(invData) ? invData : []));
      setEquipments(eqData.items || (Array.isArray(eqData) ? eqData : []));
      const userList = userData.items || (Array.isArray(userData) ? userData : []);
      setTechnicians(userList.filter(u => u.roleName === 'Technician' || u.role === 'Technician'));
      setAllSpareParts(partsData.items || (Array.isArray(partsData) ? partsData : []));
    } catch (error) {
      console.error('Erreur de chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await interventionService.createIntervention({ ...createForm, equipmentId: parseInt(createForm.equipmentId) });
      setIsCreateOpen(false);
      setCreateForm({ title: '', description: '', priority: 'Normal', equipmentId: '' });
      fetchData();
    } catch (error) {
      alert('Erreur création: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      const formattedDate = assignForm.scheduledDate ? new Date(assignForm.scheduledDate).toISOString() : new Date().toISOString();
      await interventionService.assignTechnician(selectedIntervention.id, {
        technicianId: parseInt(assignForm.technicianId), scheduledDate: formattedDate,
      });
      setIsAssignOpen(false);
      fetchData();
    } catch (error) {
      alert('Erreur assignation: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStart = async (id) => {
    try { await interventionService.startIntervention(id); fetchData(); }
    catch (error) { alert('Erreur démarrage: ' + (error.response?.data?.message || error.message)); }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await interventionService.completeIntervention(selectedIntervention.id, {
        report: completeForm.report, actualDurationMinutes: parseInt(completeForm.actualDurationMinutes),
      });
      setIsCompleteOpen(false);
      fetchData();
    } catch (error) {
      alert('Erreur clôture: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    try {
      await interventionService.cancelIntervention(selectedIntervention.id, { reason: cancelReason });
      setIsCancelOpen(false);
      setCancelReason('');
      fetchData();
    } catch (error) {
      alert('Erreur annulation: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleConsumeSparePart = async (e) => {
    e.preventDefault();
    try {
      await sparePartService.consumeSparePart(selectedIntervention.id, {
        sparePartId: parseInt(consumeForm.sparePartId), quantityConsumed: parseInt(consumeForm.quantityConsumed),
      });
      setIsConsumeSpareOpen(false);
      setConsumeForm({ sparePartId: '', quantityConsumed: 1 });
      fetchData();
    } catch (error) {
      alert('Erreur consommation pièce: ' + (error.response?.data?.message || error.message));
    }
  };

  const openDetailsModal = async (inv) => {
    setSelectedIntervention(inv);
    setIsDetailsOpen(true);
    try {
      const [hist, parts] = await Promise.all([
        interventionService.getInterventionHistory(inv.id),
        sparePartService.getSparePartsUsedInIntervention(inv.id),
      ]);
      setHistoryLogs(hist || []);
      setUsedParts(parts || []);
    } catch (err) {
      console.error('Erreur chargement détails:', err);
    }
  };

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
  const totalCount = interventions.length;

  return (
    <div className="interventions-page">

      {/* ── Toolbar ── */}
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <h1>Interventions</h1>
          <span className="item-count-badge">{totalCount}</span>
        </div>
        {isAdminOrManager && (
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)} id="btn-create-intervention">
            <Plus size={16} /> Créer une intervention
          </button>
        )}
      </div>

      {/* ── Kanban Board ── */}
      <div className="kanban-board">
        {COLUMNS.map(column => {
          const colItems = interventions.filter(i => i.status === column.id);
          return (
            <div key={column.id} className="kanban-column">

              {/* Column Header */}
              <div className="column-header">
                <div className="column-header-left">
                  <span className={`status-dot ${column.dotClass}`} />
                  <h3>{column.label}</h3>
                </div>
                <span className="column-count">{colItems.length}</span>
              </div>

              {/* Column Content */}
              <div className="column-content">
                {loading ? (
                  <div className="skeleton-cards">
                    <div className="skeleton-card" />
                    <div className="skeleton-card" style={{ height: 70 }} />
                    <div className="skeleton-card" style={{ height: 110 }} />
                  </div>
                ) : colItems.length === 0 ? (
                  <div className="column-empty">
                    <span className="column-empty-icon">{column.emptyIcon}</span>
                    <p>{column.emptyText}</p>
                  </div>
                ) : (
                  colItems.map(inv => {
                    const priority = PRIORITY_BADGE[inv.priority] || PRIORITY_BADGE.Normal;
                    const stripeColor = PRIORITY_COLOR[inv.priority] || '#3b82f6';
                    const isTechOwner = user?.id === inv.technicianUserId;
                    const canAct = isAdminOrManager || isTechOwner;

                    return (
                      <div key={inv.id} className="kanban-card">
                        <div className="card-priority-stripe" style={{ backgroundColor: stripeColor }} />

                        {/* Top row: priority badge + info button */}
                        <div className="card-top-row">
                          <div className="card-badges">
                            <span className={priority.className}>{priority.label}</span>
                          </div>
                          <button className="icon-btn" title="Détails" onClick={() => openDetailsModal(inv)} id={`btn-details-${inv.id}`}>
                            <Info size={14} />
                          </button>
                        </div>

                        {/* Title */}
                        <div className="card-title">{inv.title}</div>

                        {/* Meta */}
                        <div className="card-meta">
                          <span className="card-meta-item eq-name">
                            <Wrench size={11} /> {inv.equipmentName}
                          </span>
                          {inv.technicianName && (
                            <span className="card-meta-item tech-name">
                              <User size={11} /> {inv.technicianName}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        {canAct && (
                          <>
                            <hr className="card-divider" />
                            <div className="card-actions">
                              {column.id === 'Pending' && isAdminOrManager && (
                                <button className="card-btn card-btn-ghost" id={`btn-assign-${inv.id}`}
                                  onClick={() => { setSelectedIntervention(inv); setIsAssignOpen(true); }}>
                                  <User size={12} /> Assigner
                                </button>
                              )}
                              {column.id === 'Assigned' && canAct && (
                                <button className="card-btn card-btn-primary" id={`btn-start-${inv.id}`}
                                  onClick={() => handleStart(inv.id)}>
                                  <Play size={12} /> Démarrer
                                </button>
                              )}
                              {column.id === 'InProgress' && canAct && (
                                <>
                                  <button className="card-btn card-btn-ghost" id={`btn-piece-${inv.id}`}
                                    onClick={() => { setSelectedIntervention(inv); setIsConsumeSpareOpen(true); }}>
                                    <Package size={12} /> Pièce
                                  </button>
                                  <button className="card-btn card-btn-success" id={`btn-complete-${inv.id}`}
                                    onClick={() => { setSelectedIntervention(inv); setIsCompleteOpen(true); }}>
                                    <CheckCircle size={12} /> Terminer
                                  </button>
                                </>
                              )}
                              {['Pending', 'Assigned', 'InProgress'].includes(column.id) && isAdminOrManager && (
                                <button className="card-btn card-btn-danger icon-btn" title="Annuler" id={`btn-cancel-${inv.id}`}
                                  onClick={() => { setSelectedIntervention(inv); setIsCancelOpen(true); }}>
                                  <Ban size={12} />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════
          MODAL — Créer
      ══════════════════════════════════════════ */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>Nouvelle intervention</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Titre</label>
                  <input required type="text" className="form-input" placeholder="ex: Panne moteur principal"
                    value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea required className="form-input" rows="3" placeholder="Décrivez le problème constaté..."
                    value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Priorité</label>
                    <select className="form-input" value={createForm.priority} onChange={e => setCreateForm({...createForm, priority: e.target.value})}>
                      <option value="Low">Basse</option>
                      <option value="Normal">Normale</option>
                      <option value="High">Haute</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Équipement</label>
                    <select required className="form-input" value={createForm.equipmentId} onChange={e => setCreateForm({...createForm, equipmentId: e.target.value})}>
                      <option value="" disabled>Sélectionner...</option>
                      {equipments.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" id="btn-create-submit">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL — Assigner
      ══════════════════════════════════════════ */}
      {isAssignOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>Assigner un technicien</h3>
              <button className="modal-close" onClick={() => setIsAssignOpen(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Technicien</label>
                  <select required className="form-input" value={assignForm.technicianId}
                    onChange={e => setAssignForm({...assignForm, technicianId: e.target.value})}>
                    <option value="" disabled>Sélectionner...</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.username} ({t.email})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date prévue</label>
                  <input required type="datetime-local" className="form-input"
                    value={assignForm.scheduledDate} onChange={e => setAssignForm({...assignForm, scheduledDate: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAssignOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" id="btn-assign-submit">Assigner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL — Clôturer
      ══════════════════════════════════════════ */}
      {isCompleteOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>Clôturer l'intervention</h3>
              <button className="modal-close" onClick={() => setIsCompleteOpen(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleComplete}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Rapport final</label>
                  <textarea required className="form-input" rows="4" placeholder="Décrivez les actions réalisées..."
                    value={completeForm.report} onChange={e => setCompleteForm({...completeForm, report: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Durée réelle (minutes)</label>
                  <input required type="number" min="1" className="form-input"
                    value={completeForm.actualDurationMinutes} onChange={e => setCompleteForm({...completeForm, actualDurationMinutes: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCompleteOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" id="btn-complete-submit"
                  style={{ background: 'var(--green-subtle)', color: 'var(--green)', borderColor: 'var(--green-border)', boxShadow: '0 4px 12px var(--green-subtle)' }}>
                  <CheckCircle size={14}/> Clôturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL — Annuler
      ══════════════════════════════════════════ */}
      {isCancelOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-panel modal-panel-sm animate-fade-in">
            <div className="modal-header">
              <h3>Annuler l'intervention</h3>
              <button className="modal-close" onClick={() => setIsCancelOpen(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleCancel}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Motif d'annulation</label>
                  <textarea required className="form-input" rows="3" placeholder="Raison de l'annulation..."
                    value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCancelOpen(false)}>Fermer</button>
                <button type="submit" className="btn btn-danger" id="btn-cancel-submit">
                  <Ban size={14}/> Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL — Pièce de rechange
      ══════════════════════════════════════════ */}
      {isConsumeSpareOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-panel modal-panel-sm animate-fade-in">
            <div className="modal-header">
              <h3>Utiliser une pièce de rechange</h3>
              <button className="modal-close" onClick={() => setIsConsumeSpareOpen(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleConsumeSparePart}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Pièce de rechange</label>
                  <select required className="form-input" value={consumeForm.sparePartId}
                    onChange={e => setConsumeForm({...consumeForm, sparePartId: e.target.value})}>
                    <option value="" disabled>Sélectionner la pièce...</option>
                    {allSpareParts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantité consommée</label>
                  <input required type="number" min="1" className="form-input"
                    value={consumeForm.quantityConsumed} onChange={e => setConsumeForm({...consumeForm, quantityConsumed: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsConsumeSpareOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" id="btn-consume-submit">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL — Détails & Historique
      ══════════════════════════════════════════ */}
      {isDetailsOpen && selectedIntervention && (
        <div className="modal-overlay">
          <div className="modal-panel modal-panel-lg animate-fade-in">
            <div className="modal-header">
              <h3>Intervention #{selectedIntervention.id}</h3>
              <button className="modal-close" onClick={() => setIsDetailsOpen(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>{selectedIntervention.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>{selectedIntervention.description}</div>
              </div>

              <div className="details-grid">
                <div className="details-grid-item">
                  <strong>Équipement</strong>
                  <span>{selectedIntervention.equipmentName}</span>
                </div>
                <div className="details-grid-item">
                  <strong>Technicien</strong>
                  <span>{selectedIntervention.technicianName || 'Non assigné'}</span>
                </div>
                <div className="details-grid-item">
                  <strong>Statut</strong>
                  <span>{selectedIntervention.status}</span>
                </div>
                <div className="details-grid-item">
                  <strong>Priorité</strong>
                  <span style={{ color: PRIORITY_COLOR[selectedIntervention.priority] || 'inherit' }}>
                    {selectedIntervention.priority}
                  </span>
                </div>
              </div>

              {usedParts.length > 0 && (
                <div>
                  <div className="section-label"><Package size={13}/> Pièces utilisées ({usedParts.length})</div>
                  <ul style={{ paddingLeft: 18, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {usedParts.map((p, idx) => (
                      <li key={idx}>{p.sparePartName || p.name} — Quantité : {p.quantityConsumed || p.quantity}</li>
                    ))}
                  </ul>
                </div>
              )}

              {historyLogs.length > 0 && (
                <div>
                  <div className="section-label"><History size={13}/> Historique</div>
                  <div className="history-log">
                    {historyLogs.map((log, idx) => (
                      <div key={idx} className="history-log-item">
                        <div className="log-time">{new Date(log.timestamp || log.createdAt).toLocaleString()}</div>
                        <span className="log-action">{log.action || log.status}</span>
                        {(log.details || log.comment) && <span style={{ color: 'var(--text-muted)' }}> — {log.details || log.comment}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDetailsOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Interventions;
