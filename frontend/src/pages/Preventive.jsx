import React, { useEffect, useState, useContext } from 'react';
import preventiveService from '../services/preventiveService';
import equipmentService from '../services/equipmentService';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Plus, Play, CheckCircle, Trash2, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';
import './Preventive.css';

const Preventive = () => {
  const { user } = useContext(AuthContext);
  const [plans, setPlans] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'tasks'
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [convertingId, setConvertingId] = useState(null);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState('plan');

  // Forms
  const [planForm, setPlanForm] = useState({
    title: '',
    description: '',
    frequencyDays: 30,
    nextDueDate: '',
    equipmentId: ''
  });
  const [generateCount, setGenerateCount] = useState(1);
  const [completeRemarks, setCompleteRemarks] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'plans') {
        const [data, eqData] = await Promise.all([
          preventiveService.getAllPlans(1, 100),
          equipmentService.getAllEquipments(1, 100)
        ]);
        setPlans(data.items || (Array.isArray(data) ? data : []));
        setEquipments(eqData.items || (Array.isArray(eqData) ? eqData : []));
      } else {
        const data = await preventiveService.getAllTasks(1, 100);
        setTasks(data.items || (Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      if (!planForm.nextDueDate) {
        toast.warning("Veuillez sélectionner une date de prochaine échéance.");
        return;
      }
      const parsedDate = new Date(planForm.nextDueDate);
      if (isNaN(parsedDate.getTime())) {
        toast.warning("Date invalide.");
        return;
      }

      await preventiveService.createPlan({
        title: planForm.title,
        description: planForm.description,
        frequencyDays: parseInt(planForm.frequencyDays),
        nextDueDate: parsedDate.toISOString(),
        equipmentId: parseInt(planForm.equipmentId)
      });
      setIsPlanModalOpen(false);
      setPlanForm({ title: '', description: '', frequencyDays: 30, nextDueDate: '', equipmentId: '' });
      fetchData();
    } catch (error) {
      toast.error("Erreur création plan: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeletePlan = (id) => {
    setDeleteType('plan');
    setConfirmDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteTask = (id) => {
    setDeleteType('task');
    setConfirmDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setConfirmOpen(false);
    try {
      if (deleteType === 'task') {
        await preventiveService.deleteTask(confirmDeleteId);
        toast.success("Tâche préventive supprimée avec succès.");
      } else {
        await preventiveService.deletePlan(confirmDeleteId);
        toast.success("Plan préventif supprimé avec succès.");
      }
      fetchData();
    } catch (error) {
      toast.error("Erreur suppression: " + (error.response?.data?.message || error.message));
    }
  };

  const handleGenerateTasks = async (e) => {
    e.preventDefault();
    try {
      await preventiveService.generateTasks(selectedPlan.id, parseInt(generateCount));
      setIsGenerateOpen(false);
      toast.success(`${generateCount} occurrence(s) générée(s) avec succès !`);
      fetchData();
    } catch (error) {
      toast.error("Erreur génération tâches: " + (error.response?.data?.message || error.message));
    }
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    try {
      await preventiveService.completeTask(selectedTask.id, completeRemarks);
      setIsCompleteOpen(false);
      setCompleteRemarks('');
      fetchData();
    } catch (error) {
      toast.error("Erreur complétion tâche: " + (error.response?.data?.message || error.message));
    }
  };

  const handleConvertToIntervention = async (taskId) => {
    if (convertingId) return;
    setConvertingId(taskId);
    try {
      await preventiveService.convertToIntervention(taskId);
      toast.success("Tâche préventive convertie avec succès en Intervention !");
      await fetchData();
    } catch (error) {
      toast.error("Erreur conversion tâche: " + (error.response?.data?.message || error.message));
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="preventive-page">
      <div className="flex justify-between items-center mb-4">
        <h1>Maintenance Préventive</h1>
        {activeTab === 'plans' && (user?.role === 'Admin' ) && (
          <button className="btn btn-primary" onClick={() => setIsPlanModalOpen(true)}>
            <Plus size={18} />
            Créer un plan de maintenance
          </button>
        )}
      </div>

      <div className="tab-bar mb-4 flex gap-2">
        <button className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>
          Plans de Maintenance
        </button>
        <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          Tâches Programmées (Calendrier)
        </button>
      </div>

      {activeTab === 'plans' ? (
        <div className="card table-container" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ padding: '16px' }}>Plan / Titre</th>
                <th style={{ padding: '16px' }}>Équipement</th>
                <th style={{ padding: '16px' }}>Fréquence</th>
                <th style={{ padding: '16px' }}>Prochaine Échéance</th>
                <th style={{ padding: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center p-4">Chargement des plans...</td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-4">Aucun plan de maintenance préventive</td></tr>
              ) : (
                plans.map(plan => (
                  <tr key={plan.id}>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <strong>{plan.title}</strong>
                        <div className="text-muted"><small>{plan.description}</small></div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>{plan.equipmentName}</td>
                    <td style={{ padding: '16px' }}>Tous les {plan.frequencyDays} jours</td>
                    <td style={{ padding: '16px' }}>{new Date(plan.nextDueDate).toLocaleDateString()}</td>
                    <td style={{ padding: '16px' }}>
                      <div className="flex gap-2">
                        {(user?.role === 'Admin' ) && (
                          <>
                            <button className="icon-btn" title="Planifier des occurrences" onClick={() => { setSelectedPlan(plan); setGenerateCount(1); setIsGenerateOpen(true); }}>
                              <RefreshCw size={14} />
                            </button>
                            <button className="icon-btn btn-danger-icon" title="Supprimer le plan" onClick={() => handleDeletePlan(plan.id)}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card table-container" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ padding: '16px' }}>Date Prévue</th>
                <th style={{ padding: '16px' }}>Tâche / Plan</th>
                <th style={{ padding: '16px' }}>Équipement</th>
                <th style={{ padding: '16px' }}>Statut</th>
                <th style={{ padding: '16px' }}>Remarques</th>
                <th style={{ padding: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center p-4">Chargement du calendrier...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-4">Aucune tâche planifiée</td></tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{new Date(task.scheduledDate).toLocaleDateString()}</td>
                    <td style={{ padding: '16px' }}>{task.preventiveMaintenanceTitle}</td>
                    <td style={{ padding: '16px' }}>{task.equipmentName}</td>
                    <td style={{ padding: '16px' }}>
                      <span className={`badge ${task.status === 'Completed' ? 'badge-completed' : task.status === 'Missed' ? 'badge-cancelled' : 'badge-pending'}`}>
                        {task.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="text-muted">
                      {task.remarks || '-'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div className="flex gap-2">
                        {task.status === 'Pending' && (
                          <>
                            <button 
                              className="btn btn-secondary btn-sm flex items-center gap-1" 
                              title="Créer une intervention" 
                              disabled={convertingId !== null}
                              onClick={() => handleConvertToIntervention(task.id)}
                            >
                              <Play size={12} /> {convertingId === task.id ? 'Conversion...' : 'Intervention'}
                            </button>
                            <button 
                              className="btn btn-primary btn-sm flex items-center gap-1" 
                              title="Clôturer directement" 
                              onClick={() => { setSelectedTask(task); setCompleteRemarks(''); setIsCompleteOpen(true); }}
                            >
                              <CheckCircle size={12} /> Clôturer
                            </button>
                          </>
                        )}
                        <button 
                          className="icon-btn btn-danger-icon" 
                          title="Supprimer la tâche" 
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Create Plan */}
      {isPlanModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>Créer un Plan de Maintenance</h3>
              <button className="modal-close" onClick={() => setIsPlanModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreatePlan}>
              <div className="modal-body">
              <div className="form-group mb-3">
                <label className="form-label">Titre du Plan</label>
                <input required type="text" className="form-input" value={planForm.title} onChange={e => setPlanForm({...planForm, title: e.target.value})} placeholder="ex: Révision Mensuelle Pompe A" />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Description / Instructions</label>
                <textarea className="form-input" rows="3" value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} placeholder="ex: Graisser les joints, vérifier la pression..." />
              </div>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label className="form-label">Fréquence (jours)</label>
                  <input required type="number" min="1" className="form-input" value={planForm.frequencyDays} onChange={e => setPlanForm({...planForm, frequencyDays: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Prochaine Échéance</label>
                  <input required type="date" className="form-input" value={planForm.nextDueDate} onChange={e => setPlanForm({...planForm, nextDueDate: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Équipement</label>
                  <select required className="form-input" value={planForm.equipmentId} onChange={e => setPlanForm({...planForm, equipmentId: e.target.value})}>
                    <option value="" disabled>Sélectionner...</option>
                    {equipments.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                  </select>
                </div>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPlanModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer le plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Generate Tasks */}
      {isGenerateOpen && selectedPlan && (
        <div className="modal-overlay">
          <div className="modal-panel modal-panel-sm animate-fade-in">
            <div className="modal-header">
              <h3>Planifier des opérations</h3>
              <button className="modal-close" onClick={() => setIsGenerateOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleGenerateTasks}>
              <div className="modal-body">
              <div className="form-group text-center mb-4">
                <h4>{selectedPlan.title}</h4>
                <p className="text-muted">Génération automatique des prochaines occurrences.</p>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Nombre d'échéances à générer</label>
                <input required type="number" min="1" max="12" className="form-input text-center" style={{ fontSize: '1.5rem' }} value={generateCount} onChange={e => setGenerateCount(e.target.value)} />
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsGenerateOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Générer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Complete Task */}
      {isCompleteOpen && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-panel animate-fade-in">
            <div className="modal-header">
              <h3>Clôturer la Tâche Préventive</h3>
              <button className="modal-close" onClick={() => setIsCompleteOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCompleteTask}>
              <div className="modal-body">
              <div className="form-group mb-4">
                <label className="form-label">Remarques / Observations</label>
                <textarea required className="form-input" rows="4" value={completeRemarks} onChange={e => setCompleteRemarks(e.target.value)} placeholder="Décrivez les résultats de la vérification..."></textarea>
              </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCompleteOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Clôturer</button>
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
        title={deleteType === 'task' ? "Supprimer la tâche préventive" : "Supprimer le plan de maintenance"}
        message={deleteType === 'task'
          ? <>Voulez-vous vraiment supprimer cette tâche préventive ? Cette action est <strong>irréversible</strong>.</>
          : <>Voulez-vous vraiment supprimer ce plan de maintenance ? Cette action est <strong>irréversible</strong>.</>
        }
        confirmText="Supprimer"
        variant="danger"
      />
    </div>
  );
};

export default Preventive;
