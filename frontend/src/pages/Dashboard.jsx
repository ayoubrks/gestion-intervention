import React, { useEffect, useState } from 'react';
import statisticsService from '../services/statisticsService';
import { 
  Wrench, CalendarClock, Package, AlertTriangle, 
  Clock, TrendingUp, DollarSign, Activity, Bot, RefreshCw
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [synthesis, setSynthesis] = useState('');
  const [loading, setLoading] = useState(true);
  const [synthLoading, setSynthLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsData, synthData] = await Promise.all([
        statisticsService.getDashboardStats(),
        statisticsService.getAISynthesis()
      ]);
      setStats(statsData);
      setSynthesis(synthData.synthesis);
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSynthesis = async () => {
    setSynthLoading(true);
    try {
      const data = await statisticsService.getAISynthesis();
      setSynthesis(data.synthesis);
    } catch (error) {
      console.error("Erreur synthèse IA:", error);
    } finally {
      setSynthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Activity size={48} className="animate-pulse" />
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  const dist = stats?.statusDistribution || {};

  return (
    <div className="dashboard-page">
      <div className="flex justify-between items-center mb-4">
        <h1>Tableau de Bord</h1>
        <button className="btn btn-secondary" onClick={fetchDashboard}>
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--blue-subtle)', color: 'var(--blue)' }}>
            <Wrench size={24} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Équipements</span>
            <span className="kpi-value">{stats?.totalEquipments ?? 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--amber-subtle)', color: 'var(--amber)' }}>
            <CalendarClock size={24} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Interventions</span>
            <span className="kpi-value">{stats?.totalInterventions ?? 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--green-subtle)', color: 'var(--green)' }}>
            <Clock size={24} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">MTTR (min)</span>
            <span className="kpi-value">{stats?.averageMTTR ?? 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-light)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Préventif (%)</span>
            <span className="kpi-value">{stats?.preventiveSuccessRate ?? 0}%</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--red-subtle)', color: 'var(--red)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Stock Bas</span>
            <span className="kpi-value">{stats?.lowStockPartsCount ?? 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--green-subtle)', color: 'var(--green)' }}>
            <DollarSign size={24} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Coût Pièces (€)</span>
            <span className="kpi-value">{stats?.totalSparePartCost ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Second row: Status Distribution + AI Synthesis */}
      <div className="dashboard-row">
        {/* Status Distribution */}
        <div className="card status-card">
          <h3>Répartition des Interventions</h3>
          <div className="status-bars">
            <StatusBar label="En attente" count={dist.pending ?? 0} total={stats?.totalInterventions || 1} color="var(--amber)" />
            <StatusBar label="Assigné" count={dist.assigned ?? 0} total={stats?.totalInterventions || 1} color="var(--accent-light)" />
            <StatusBar label="En cours" count={dist.inProgress ?? 0} total={stats?.totalInterventions || 1} color="var(--blue)" />
            <StatusBar label="Terminé" count={dist.completed ?? 0} total={stats?.totalInterventions || 1} color="var(--green)" />
          </div>
        </div>

        {/* AI Synthesis */}
        <div className="card ai-card">
          <div className="ai-card-header">
            <div className="flex items-center gap-2">
              <div className="ai-icon"><Bot size={20} /></div>
              <h3>Synthèse IA</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={refreshSynthesis} disabled={synthLoading}>
              <RefreshCw size={14} className={synthLoading ? 'animate-spin' : ''} />
              {synthLoading ? 'Analyse...' : 'Actualiser'}
            </button>
          </div>
          <div className="ai-content">
            {synthesis ? (
              <div className="ai-text" dangerouslySetInnerHTML={{ __html: renderMarkdown(synthesis) }} />
            ) : (
              <p className="text-muted">Aucune synthèse disponible. Cliquez sur "Actualiser".</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Status Bar component
const StatusBar = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="status-bar-item">
      <div className="status-bar-label">
        <span>{label}</span>
        <span style={{ color }}>{count} ({percentage}%)</span>
      </div>
      <div className="status-bar-track">
        <div className="status-bar-fill" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
};

// Minimal Markdown to HTML
function renderMarkdown(text) {
  return text
    .replace(/### (.*)/g, '<h4>$1</h4>')
    .replace(/#### (.*)/g, '<h5>$1</h5>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default Dashboard;
