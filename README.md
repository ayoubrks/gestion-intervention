# 🔧 SmartMaintenance — Gestion d'Interventions

Application web de gestion de maintenance industrielle. Elle permet de créer, assigner et suivre des interventions techniques sur des équipements, avec un tableau Kanban interactif et une gestion complète des techniciens, pièces de rechange et maintenance préventive.

## 📌 Technologies utilisées

| Couche | Stack |
|---|---|
| **Backend (API)** | .NET 9 — ASP.NET Core Web API (Clean Architecture) |
| **Frontend** | React 18 + Vite |
| **Base de données** | PostgreSQL |
| **Authentification** | JWT (JSON Web Tokens) |

---

## 📂 Structure du Projet

```
gestion-intervention/
├── SmartMaintenanceAI/              ← 🟢 Backend actuel (API .NET)
│   ├── SmartMaintenance.Api/        ← Contrôleurs, configuration, Program.cs
│   ├── SmartMaintenance.Application/← DTOs, Interfaces des services
│   ├── SmartMaintenance.Domain/     ← Entités (User, Intervention, Equipment...)
│   └── SmartMaintenance.Infrastructure/ ← Services, DbContext, Migrations, Seeder
│
├── frontend/                        ← 🟢 Frontend React
│   └── src/
│       ├── pages/                   ← Pages : Dashboard, Interventions (Kanban),
│       │                              Equipments, SpareParts, Preventive, Users,
│       │                              Settings, Login, Register
│       ├── components/              ← Composants réutilisables (Layout, Sidebar...)
│       ├── context/                 ← AuthContext (gestion de session JWT)
│       └── services/                ← Appels API (axios)
│
├── backend_old/                     ← ⚠️ Ancien backend (NE PAS UTILISER, voir ci-dessous)
└── README.md
```

### ⚠️ Pourquoi le dossier `backend_old` ?

Le dossier `backend_old/` contient l'ancienne version du backend qui a été **remplacée** par le nouveau backend dans `SmartMaintenanceAI/`. Le nouveau backend utilise une **architecture Clean** (séparation en couches Domain, Application, Infrastructure, API) alors que l'ancien était un projet monolithique simple.

**`backend_old` n'est plus utilisé. Le seul backend fonctionnel est `SmartMaintenanceAI/`.**

---

## 🚀 Comment lancer le projet

### Prérequis

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/download/) (installé et en cours d'exécution)
- [EF Core CLI](https://learn.microsoft.com/en-us/ef/core/cli/dotnet) — installer avec :
  ```bash
  dotnet tool install --global dotnet-ef
  ```

---

### Étape 1 : Configurer la Base de Données

1. Ouvrez le fichier `SmartMaintenanceAI/SmartMaintenance.Api/appsettings.json`
2. Modifiez la chaîne de connexion avec **vos identifiants PostgreSQL locaux** :

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=SmartMaintenanceDB;Username=postgres;Password=VOTRE_MOT_DE_PASSE"
}
```

> **Note :** Vous n'avez **pas** besoin de créer la base manuellement. EF Core va la créer pour vous à l'étape suivante.

---

### Étape 2 : Créer la Base de Données (Migrations)

Ouvrez un terminal dans le dossier `SmartMaintenanceAI/` et exécutez :

```bash
cd SmartMaintenanceAI
dotnet ef database update --project SmartMaintenance.Infrastructure --startup-project SmartMaintenance.Api
```

Cela va :
- Créer la base `SmartMaintenanceDB` sur votre PostgreSQL
- Appliquer toutes les migrations (tables, relations, index)
- Insérer des données de test (utilisateurs, équipements, interventions) au premier lancement de l'API

---

### Étape 3 : Lancer le Backend (API)

```bash
cd SmartMaintenanceAI/SmartMaintenance.Api
dotnet run
```

L'API démarre sur `http://localhost:5000` (ou `https://localhost:5001`).

> ⚡ Laissez ce terminal ouvert.

---

### Étape 4 : Lancer le Frontend (React)

Dans un **nouveau terminal** :

```bash
cd frontend
npm install
npm run dev
```

Le site sera accessible sur `http://localhost:5173`.

---

## 🔐 Comptes de Test

Au premier lancement, la base est remplie automatiquement avec ces comptes :

| Rôle | Email | Mot de passe |
|---|---|---|
| **Admin** | `admin@smartmaintenance.com` | `Admin123!` |
| **** | `@smartmaintenance.com` | `123!` |
| **Technicien 1** | `tech1@smartmaintenance.com` | `Tech123!` |
| **Technicien 2** | `tech2@smartmaintenance.com` | `Tech123!` |

---

## 🗄️ Schéma de la Base de Données

Les principales entités et leurs relations :

```
Users ──────┐
  │         │ (1:1)
  │     Technicians
  │         │ (1:N)
  │     Interventions ──── Equipment (N:1)
  │         │                  │
  │         │              EquipmentCategory (N:1)
  │         │
  │     InterventionHistories
  │     InterventionSpareParts ──── SpareParts
  │
  └── Roles (N:1)

PreventiveMaintenances ──── Equipment (N:1)
        │
    MaintenanceTasks
```

- Un **User** a un **Role** (Admin, , Technician)
- Un **User** avec le rôle Technician a un profil **Technician**
- Une **Intervention** est liée à un **Equipment** et peut être assignée à un **Technician**
- L'**InterventionHistory** trace tous les changements de statut
- Les **SpareParts** peuvent être consommées par une intervention

---

## 📋 Fonctionnalités

- ✅ **Tableau de bord** avec statistiques en temps réel
- ✅ **Gestion des interventions** via tableau Kanban (En attente → Assigné → En cours → Terminé / Annulé)
- ✅ **Gestion des équipements** avec catégories
- ✅ **Gestion des pièces de rechange** avec suivi du stock
- ✅ **Maintenance préventive** avec planification
- ✅ **Gestion des utilisateurs** et des rôles
- ✅ **Authentification JWT** avec contrôle d'accès par rôle
- ✅ **Historique des interventions** (traçabilité complète)
