import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, CheckCircle2 } from 'lucide-react';
import aiService from '../../services/aiService';
import interventionService from '../../services/interventionService';
import equipmentService from '../../services/equipmentService';
import preventiveService from '../../services/preventiveService';
import sparePartService from '../../services/sparePartService';
import './Chatbot.css';

const SUGGESTED_QUESTIONS = [
  "🔧 Diagnostic surchauffe pompe",
  "⚡ Problème moteur électrique",
  "🛡️ Consignes de sécurité / EPI",
  "➕ Créer une intervention",
  "📅 Créer un plan préventif",
  "📦 Ajouter une pièce de rechange",
];

// ─── Flow Steps Definitions ──────────────────────────────────────────

const INTERVENTION_STEPS = [
  {
    key: 'title',
    ask: "📋 **Étape 1/5** — Quel est le **titre** de l'intervention ?\n\n_(ex : Remplacement filtre hydraulique, Diagnostic bruit compresseur...)_",
    placeholder: "Titre de l'intervention...",
  },
  {
    key: 'description',
    ask: "📝 **Étape 2/5** — Donnez une **description** du problème ou de la tâche :\n\n_(Décrivez les symptômes, la localisation, les observations...)_",
    placeholder: "Description...",
  },
  {
    key: 'priority',
    ask: "🚦 **Étape 3/5** — Quelle est la **priorité** ?\n\nChoisissez parmi les options ci-dessous :",
    placeholder: null,
    chips: [
      { label: "🟢 Faible",    value: "Low" },
      { label: "🔵 Normale",   value: "Normal" },
      { label: "🟠 Haute",     value: "High" },
      { label: "🔴 Critique",  value: "Critical" },
    ],
  },
  {
    key: 'equipment',
    ask: "🏭 **Étape 4/5** — Sur quel **équipement** porte l'intervention ?\n\nChargement de la liste des équipements...",
    placeholder: "Sélectionnez un équipement...",
    dynamicChips: true,
  },
  {
    key: 'plannedDate',
    ask: "📅 **Étape 5/5** — Quelle est la **date planifiée** ?\n\n_(Tapez une date au format JJ/MM/AAAA ou tapez **maintenant** pour aujourd'hui)_",
    placeholder: "Ex: 20/08/2026 ou 'maintenant'",
  },
];

const PREVENTIVE_STEPS = [
  {
    key: 'title',
    ask: "📅 **Étape 1/5** — Quel est le **titre du plan préventif** ?\n\n_(ex : Vidange mensuelle pompe P-101, Inspection trimestrielle moteur M-02)_",
    placeholder: "Titre de la maintenance préventive...",
  },
  {
    key: 'description',
    ask: "📝 **Étape 2/5** — Quelle est la **description ou les consignes** pour cette tâche préventive ?",
    placeholder: "Description de la procédure préventive...",
  },
  {
    key: 'frequencyDays',
    ask: "⏱️ **Étape 3/5** — Quelle est la **fréquence d'exécution (en jours)** ?\n\nChoisissez une fréquence ou tapez un nombre de jours :",
    placeholder: "Nombre de jours (ex: 30)...",
    chips: [
      { label: "7 jours (Hebdomadaire)", value: "7" },
      { label: "30 jours (Mensuel)",     value: "30" },
      { label: "90 jours (Trimestriel)",  value: "90" },
      { label: "180 jours (Semestriel)", value: "180" },
      { label: "365 jours (Annuel)",     value: "365" },
    ],
  },
  {
    key: 'equipment',
    ask: "🏭 **Étape 4/5** — À quel **équipement** associer cette maintenance préventive ?",
    placeholder: "Sélectionnez un équipement...",
    dynamicChips: true,
  },
  {
    key: 'nextDueDate',
    ask: "🗓️ **Étape 5/5** — Quelle est la **première date d'échéance** ?\n\n_(Format JJ/MM/AAAA ou **demain**, **maintenant**)_",
    placeholder: "Ex: 01/09/2026...",
  },
];

const SPAREPART_STEPS = [
  {
    key: 'name',
    ask: "📦 **Étape 1/6** — Quel est le **nom** de la pièce de rechange ?\n\n_(ex : Joint d'étanchéité 50mm, Roulement à billes SKF 6204...)_",
    placeholder: "Nom de la pièce...",
  },
  {
    key: 'reference',
    ask: "🏷️ **Étape 2/6** — Quelle est la **référence fabricant ou interne** ?\n\n_(ex : REF-4892, SKF-6204-2RSH...)_",
    placeholder: "Référence...",
  },
  {
    key: 'description',
    ask: "📝 **Étape 3/6** — Entrez une brève **description** de la pièce :",
    placeholder: "Description ou caractéristiques...",
  },
  {
    key: 'unitCost',
    ask: "💰 **Étape 4/6** — Quel est le **prix / coût unitaire en €** ?\n\n_(ex : 15.50, 45.00...)_",
    placeholder: "Prix en €...",
  },
  {
    key: 'stockQuantity',
    ask: "📊 **Étape 5/6** — Quelle est la **quantité actuelle en stock** ?",
    placeholder: "Quantité en stock (ex: 10)...",
  },
  {
    key: 'minimumThreshold',
    ask: "⚠️ **Étape 6/6** — Quel est le **seuil d'alerte stock bas** ?\n\n_(Une alerte sera émise lorsque le stock passe en dessous de ce nombre)_",
    placeholder: "Seuil d'alerte (ex: 2)...",
  },
];

// Triggers classification
const detectCreationType = (text) => {
  const t = text.toLowerCase();
  if (/pi[èe]ce|spare|stock/i.test(t) && /cr[eé]er|ajouter|nouvelle|add/i.test(t)) {
    return 'sparepart';
  }
  if (/pr[eé]ventif|maintenance pr[eé]ventive|plan/i.test(t) && /cr[eé]er|ajouter|nouveau|add/i.test(t)) {
    return 'preventive';
  }
  if (/cr[eé]er|nouvelle intervention|nouvelle inter|créer inter|créer une|crée|add intervention|➕/i.test(t)) {
    return 'intervention';
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────
const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Bonjour ! 👋 Je suis votre assistant IA SmartMaintenance.\n\nJe peux vous aider avec le diagnostic de pannes, les procédures de maintenance, la sécurité ou la **création rapide** d\'interventions, de maintenances préventives et de pièces de rechange.\n\nCliquez sur une suggestion ci-dessous ou posez votre question !',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Creation flow state
  const [creationType, setCreationType] = useState(null); // 'intervention' | 'preventive' | 'sparepart'
  const [creationStep, setCreationStep] = useState(0);
  const [creationData, setCreationData] = useState({});
  const [equipmentList, setEquipmentList] = useState([]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const addBotMsg = (text, extra = {}) => {
    setMessages(prev => [...prev, { sender: 'bot', text, ...extra }]);
  };

  const addUserMsg = (text) => {
    setMessages(prev => [...prev, { sender: 'user', text }]);
  };

  // ── Start Creation Flow ──
  const startCreationFlow = async (type) => {
    setCreationType(type);
    setCreationStep(0);
    setCreationData({});

    if (type === 'intervention' || type === 'preventive') {
      try {
        const res = await equipmentService.getAllEquipments(1, 100);
        setEquipmentList(res.items || res || []);
      } catch {
        setEquipmentList([]);
      }
    }

    let steps = INTERVENTION_STEPS;
    let label = "une nouvelle intervention";
    if (type === 'preventive') {
      steps = PREVENTIVE_STEPS;
      label = "un nouveau plan de maintenance préventive";
    } else if (type === 'sparepart') {
      steps = SPAREPART_STEPS;
      label = "une nouvelle pièce de rechange";
    }

    addBotMsg(
      `🛠️ **Parfait ! Je vais vous guider pour créer ${label}.**\n\nRépondez à chaque question. Vous pouvez taper votre réponse ou cliquer sur une option proposée.\n\n` +
      steps[0].ask
    );
  };

  // ── Get Current Steps Array ──
  const getSteps = () => {
    if (creationType === 'preventive') return PREVENTIVE_STEPS;
    if (creationType === 'sparepart') return SPAREPART_STEPS;
    return INTERVENTION_STEPS;
  };

  // ── Handle Creation Answers ──
  const handleCreationAnswer = async (answer) => {
    const steps = getSteps();
    const step = steps[creationStep];

    if (!answer || !answer.trim()) return;

    addUserMsg(answer.trim());
    setInput('');

    let value = answer.trim();

    // Date parsing helper
    if (step.key === 'plannedDate' || step.key === 'nextDueDate') {
      if (/maintenant|aujourd'?hui|now|today/i.test(value)) {
        value = new Date().toISOString();
      } else if (/demain|tomorrow/i.test(value)) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        value = d.toISOString();
      } else {
        const parts = value.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          const parsed = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
          value = isNaN(parsed) ? new Date().toISOString() : parsed.toISOString();
        } else {
          const parsed = new Date(value);
          value = isNaN(parsed) ? new Date().toISOString() : parsed.toISOString();
        }
      }
    }

    // Equipment selection helper
    let equipmentId = null;
    if (step.key === 'equipment') {
      if (value.includes(':')) {
        const [id] = value.split(':');
        equipmentId = parseInt(id);
        value = equipmentList.find(e => e.id === equipmentId)?.name || value;
      } else {
        const found = equipmentList.find(e =>
          e.name.toLowerCase().includes(value.toLowerCase())
        );
        equipmentId = found?.id || null;
        value = found?.name || value;
      }
    }

    const newData = {
      ...creationData,
      [step.key]: step.key === 'equipment' ? { id: equipmentId, name: value } : value,
    };
    setCreationData(newData);

    const nextStep = creationStep + 1;

    if (nextStep < steps.length) {
      setCreationStep(nextStep);
      const nextStepDef = steps[nextStep];

      let msgText = nextStepDef.ask;
      if (nextStepDef.dynamicChips) {
        if (equipmentList.length > 0) {
          msgText = `🏭 **Étape ${nextStep+1}/${steps.length}** — Sur quel **équipement** ?\n\nChoisissez parmi les ${equipmentList.length} équipements disponibles :`;
        } else {
          msgText = `🏭 **Étape ${nextStep+1}/${steps.length}** — Sur quel **équipement** ?\n\n_(Aucun équipement trouvé. Tapez le nom manuellement.)_`;
        }
      }

      addBotMsg(msgText);
    } else {
      await submitCreation(newData);
    }
  };

  // ── Submit Creation ──
  const submitCreation = async (data) => {
    setIsTyping(true);

    try {
      if (creationType === 'intervention') {
        addBotMsg("⏳ Création de l'intervention en cours...");
        await interventionService.createIntervention({
          title: data.title,
          description: data.description || '',
          priority: data.priority,
          equipmentId: data.equipment?.id,
          plannedDate: data.plannedDate,
        });

        addBotMsg(
          `✅ **Intervention créée avec succès !**\n\n` +
          `📋 **Titre :** ${data.title}\n` +
          `🚦 **Priorité :** ${data.priority}\n` +
          `🏭 **Équipement :** ${data.equipment?.name}\n` +
          `📅 **Date planifiée :** ${new Date(data.plannedDate).toLocaleDateString('fr-FR')}\n\n` +
          `L'intervention est en statut **En attente**.`,
          { isSuccess: true }
        );
      } else if (creationType === 'preventive') {
        addBotMsg("⏳ Création du plan préventif en cours...");
        await preventiveService.createPlan({
          title: data.title,
          description: data.description || '',
          frequencyDays: parseInt(data.frequencyDays) || 30,
          nextDueDate: data.nextDueDate,
          equipmentId: data.equipment?.id,
        });

        addBotMsg(
          `✅ **Plan préventif créé avec succès !**\n\n` +
          `📅 **Titre :** ${data.title}\n` +
          `⏱️ **Fréquence :** Tous les ${data.frequencyDays} jours\n` +
          `🏭 **Équipement :** ${data.equipment?.name}\n` +
          `🗓️ **Prochaine échéance :** ${new Date(data.nextDueDate).toLocaleDateString('fr-FR')}\n\n` +
          `Le calendrier préventif est désormais configuré.`,
          { isSuccess: true }
        );
      } else if (creationType === 'sparepart') {
        addBotMsg("⏳ Ajout de la pièce de rechange en cours...");
        await sparePartService.createSparePart({
          name: data.name,
          reference: data.reference,
          description: data.description || '',
          unitCost: parseFloat(data.unitCost) || 0,
          stockQuantity: parseInt(data.stockQuantity) || 0,
          minimumThreshold: parseInt(data.minimumThreshold) || 0,
        });

        addBotMsg(
          `✅ **Pièce de rechange ajoutée avec succès !**\n\n` +
          `📦 **Nom :** ${data.name}\n` +
          `🏷️ **Référence :** ${data.reference}\n` +
          `💰 **Prix unitaire :** ${data.unitCost} €\n` +
          `📊 **Stock initial :** ${data.stockQuantity} (Seuil alerte: ${data.minimumThreshold})\n\n` +
          `La pièce est enregistrée dans l'inventaire.`,
          { isSuccess: true }
        );
      }
    } catch (err) {
      addBotMsg(
        `❌ **Erreur lors de la création.**\n\n_Détail : ${err?.response?.data?.message || err.message || 'Champs invalides ou problème serveur.'}_`
      );
    } finally {
      setIsTyping(false);
      setCreationType(null);
      setCreationStep(0);
      setCreationData({});
    }
  };

  // ── Normal Chat ──
  const sendNormalMessage = async (text) => {
    addUserMsg(text);
    setInput('');
    setIsTyping(true);
    try {
      const response = await aiService.chat(text);
      addBotMsg(response.reply);
    } catch {
      addBotMsg('❌ Désolé, une erreur est survenue. Vérifiez que le backend est en marche.');
    } finally {
      setIsTyping(false);
    }
  };

  // ── Main Send Handler ──
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const trimmed = text.trim();

    if (creationType) {
      await handleCreationAnswer(trimmed);
      return;
    }

    const detectedType = detectCreationType(trimmed);
    if (detectedType) {
      addUserMsg(trimmed);
      setInput('');
      await startCreationFlow(detectedType);
      return;
    }

    await sendNormalMessage(trimmed);
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  // ── Compute Chips to Render ──
  const getChipsForCurrentState = () => {
    if (creationType && !isTyping) {
      const steps = getSteps();
      const step = steps[creationStep];
      if (step?.chips) return step.chips.map(c => ({ label: c.label, value: c.value }));
      if (step?.dynamicChips && equipmentList.length > 0) {
        return equipmentList.slice(0, 12).map(e => ({ label: `🏭 ${e.name}`, value: `${e.id}:${e.name}` }));
      }
      return null;
    }

    const lastMsg = messages[messages.length - 1];
    if (!isTyping && lastMsg?.sender === 'bot') {
      return SUGGESTED_QUESTIONS.map(q => ({ label: q, value: q }));
    }
    return null;
  };

  const chips = getChipsForCurrentState();

  const getCreationBadgeLabel = () => {
    if (creationType === 'preventive') return '+ Plan préventif';
    if (creationType === 'sparepart') return '+ Pièce de rechange';
    return '+ Nouvelle intervention';
  };

  return (
    <div className="chatbot-wrapper">
      <button
        className={`chatbot-toggle-btn ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        title="Ouvrir l'assistant IA"
      >
        <MessageSquare size={24} />
      </button>

      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-title">
            <Sparkles size={20} />
            <span>Assistant IA</span>
            {creationType && <span className="creation-badge">{getCreationBadgeLabel()}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {creationType && (
              <button
                className="chatbot-close-btn"
                title="Annuler"
                onClick={() => {
                  setCreationType(null);
                  setCreationStep(0);
                  setCreationData({});
                  addBotMsg("❌ Création annulée. Comment puis-je vous aider ?");
                }}
              >
                <X size={14} /> <span style={{ fontSize: '0.7rem' }}>Annuler</span>
              </button>
            )}
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chatbot-message ${msg.sender} ${msg.isSuccess ? 'success-msg' : ''}`}>
              <div className="message-icon">
                {msg.sender === 'bot'
                  ? (msg.isSuccess ? <CheckCircle2 size={14} /> : <Bot size={14} />)
                  : <User size={14} />}
              </div>
              <div className="message-content">
                {msg.text.split('\n').map((line, i, arr) => {
                  const cleaned = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>');
                  return (
                    <span key={i}>
                      <span dangerouslySetInnerHTML={{ __html: cleaned }} />
                      {i < arr.length - 1 && <br />}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chatbot-message bot">
              <div className="message-icon"><Bot size={14} /></div>
              <div className="message-content typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          {chips && (
            <div className="chatbot-suggestions">
              <p className="suggestions-label">
                {creationType ? 'Choisissez une option :' : 'Suggestions :'}
              </p>
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  className="suggestion-chip"
                  onClick={() => sendMessage(chip.value)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input-area" onSubmit={handleSend}>
          <input
            type="text"
            placeholder={
              creationType
                ? (getSteps()[creationStep]?.placeholder || 'Votre réponse...')
                : 'Posez votre question...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            autoFocus={isOpen}
          />
          <button type="submit" disabled={isTyping || !input.trim()} className="send-btn">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
