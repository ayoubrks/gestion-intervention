import React, { useEffect, useState } from 'react';
import statisticsService from '../services/statisticsService';
import { 
  Wrench, CalendarClock, Package, AlertTriangle, 
  Clock, TrendingUp, DollarSign, Activity, Bot, RefreshCw,
  CheckCircle2, XCircle, Hourglass, ShieldCheck, TriangleAlert, Info
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [synthesis, setSynthesis] = useState(null);
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
      setSynthesis(synthData);
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
      setSynthesis(data);
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
        <KpiCard icon={<Wrench size={22}/>} label="Équipements" value={stats?.totalEquipments ?? 0} color="blue" />
        <KpiCard icon={<CalendarClock size={22}/>} label="Interventions" value={stats?.totalInterventions ?? 0} color="amber" />
        <KpiCard icon={<Clock size={22}/>} label="MTTR (min)" value={stats?.averageMTTR ?? 0} color="green" />
        <KpiCard icon={<TrendingUp size={22}/>} label="Préventif" value={`${stats?.preventiveSuccessRate ?? 0}%`} color="accent" />
        <KpiCard icon={<AlertTriangle size={22}/>} label="Stock Bas" value={stats?.lowStockPartsCount ?? 0} color="red" />
        <KpiCard icon={<DollarSign size={22}/>} label={`Coût Pièces (${localStorage.getItem('app-currency') || 'MAD'})`} value={stats?.totalSparePartCost ?? 0} color="green" />
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
              <AISynthesisView data={synthesis} />
            ) : (
              <p className="text-muted">Aucune synthèse disponible.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── KPI Card ── */
const colorMap = {
  blue:   { bg: 'var(--blue-subtle)',   fg: 'var(--blue)' },
  amber:  { bg: 'var(--amber-subtle)',  fg: 'var(--amber)' },
  green:  { bg: 'var(--green-subtle)',  fg: 'var(--green)' },
  accent: { bg: 'var(--accent-subtle)', fg: 'var(--accent-light)' },
  red:    { bg: 'var(--red-subtle)',    fg: 'var(--red)' },
};

const KpiCard = ({ icon, label, value, color }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: c.bg, color: c.fg }}>{icon}</div>
      <div className="kpi-body">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value">{value}</span>
      </div>
    </div>
  );
};

/* ── Status Bar ── */
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

/* ── AI Synthesis Structured View ── */
const AISynthesisView = ({ data }) => {
  const { parc, interventions, performance, recommendations } = data;
  const curr = localStorage.getItem('app-currency') || 'MAD';

  return (
    <div className="synth-root">

      {/* Parc Overview */}
      <section className="synth-section">
        <div className="synth-section-title">
          <Wrench size={15} /> Parc Équipements
        </div>
        <div className="synth-stat-row">
          <SynthStat label="Total" value={parc?.total ?? 0} />
          <SynthStat label="Actifs" value={parc?.active ?? 0} accent="green" />
          <SynthStat label="En maintenance" value={parc?.maintenance ?? 0} accent="amber" />
          <SynthStat label="Hors service" value={parc?.horsService ?? 0} accent="red" />
        </div>
      </section>

      {/* Interventions */}
      <section className="synth-section">
        <div className="synth-section-title">
          <CalendarClock size={15} /> Interventions
        </div>
        <div className="synth-stat-row">
          <SynthStat label="Total" value={interventions?.total ?? 0} />
          <SynthStat label="En attente" value={interventions?.pending ?? 0} accent="amber" />
          <SynthStat label="En cours" value={interventions?.inProgress ?? 0} accent="blue" />
          <SynthStat label="Terminées" value={interventions?.completed ?? 0} accent="green" />
        </div>
      </section>

      {/* Performance */}
      <section className="synth-section">
        <div className="synth-section-title">
          <TrendingUp size={15} /> Performance
        </div>
        <div className="synth-stat-row">
          <SynthStat label="MTTR (min)" value={performance?.mttr ?? 0} accent="blue" />
          <SynthStat label="Taux préventif" value={`${performance?.preventiveRate ?? 0}%`} accent={performance?.preventiveRate >= 80 ? 'green' : 'amber'} />
          <SynthStat label="Stock bas" value={performance?.lowStockCount ?? 0} accent={performance?.lowStockCount > 0 ? 'red' : 'green'} />
          <SynthStat label="Coût pièces" value={`${performance?.totalSparePartCost ?? 0} ${curr}`} />
        </div>
      </section>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <section className="synth-section">
          <div className="synth-section-title">
            <Bot size={15} /> Recommandations IA
          </div>
          <div className="synth-recs">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

/* ── Single Stat Box ── */
const accentColors = {
  green: 'var(--green)',
  amber: 'var(--amber)',
  red:   'var(--red)',
  blue:  'var(--blue)',
};

const SynthStat = ({ label, value, accent }) => (
  <div className="synth-stat">
    <span className="synth-stat-value" style={accent ? { color: accentColors[accent] } : {}}>{value}</span>
    <span className="synth-stat-label">{label}</span>
  </div>
);

/* ── Recommendation Card ── */
const recConfig = {
  success: { icon: <CheckCircle2 size={16}/>, cls: 'rec-success', label: '✅ Bon état' },
  warning: { icon: <TriangleAlert size={16}/>, cls: 'rec-warning', label: '⚠️ Attention' },
  danger:  { icon: <XCircle size={16}/>,       cls: 'rec-danger',  label: '🔴 Critique' },
  info:    { icon: <Info size={16}/>,           cls: 'rec-info',    label: 'ℹ️ Info' },
};

const RecommendationCard = ({ rec }) => {
  const cfg = recConfig[rec.type] || recConfig.info;
  return (
    <div className={`rec-card ${cfg.cls}`}>
      <div className="rec-header">
        {cfg.icon}
        <span className="rec-title">{rec.title}</span>
      </div>
      <p className="rec-desc">{rec.description}</p>
      {rec.items && rec.items.length > 0 && (
        <ul className="rec-items">
          {rec.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
