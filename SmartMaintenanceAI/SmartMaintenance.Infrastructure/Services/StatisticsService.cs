using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Application.Interfaces;
using SmartMaintenance.Infrastructure.Data;
using System.Text;

namespace SmartMaintenance.Infrastructure.Services
{
    public class StatisticsService : IStatisticsService
    {
        private readonly AppDbContext _context;

        public StatisticsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetDashboardStatsAsync()
        {
            var totalEquipments = await _context.Equipments.CountAsync();
            var totalInterventions = await _context.Interventions.CountAsync();
            
            // MTTR: Moyenne de la durée réelle des interventions terminées
            var completedInterventions = await _context.Interventions
                .Where(i => i.Status == "Completed" && i.ActualDurationMinutes.HasValue)
                .ToListAsync();
            
            double averageMTTR = completedInterventions.Any() 
                ? completedInterventions.Average(i => i.ActualDurationMinutes.Value) 
                : 0;

            // Taux de réussite du préventif
            var totalTasks = await _context.MaintenanceTasks.CountAsync();
            var completedTasks = await _context.MaintenanceTasks.CountAsync(t => t.Status == "Completed");
            double preventiveSuccessRate = totalTasks > 0 
                ? ((double)completedTasks / totalTasks) * 100 
                : 100;

            // Pièces en stock bas
            var lowStockParts = await _context.SpareParts
                .CountAsync(sp => sp.StockQuantity <= sp.MinimumThreshold);

            // Coût total des pièces utilisées
            var totalSparePartCost = await _context.InterventionSpareParts
                .Include(isp => isp.SparePart)
                .SumAsync(isp => (double)isp.QuantityUsed * (double)isp.SparePart.UnitCost);

            // Interventions par statut
            var pending = await _context.Interventions.CountAsync(i => i.Status == "Pending");
            var assigned = await _context.Interventions.CountAsync(i => i.Status == "Assigned");
            var inProgress = await _context.Interventions.CountAsync(i => i.Status == "InProgress");
            var completed = await _context.Interventions.CountAsync(i => i.Status == "Completed");

            return new
            {
                TotalEquipments = totalEquipments,
                TotalInterventions = totalInterventions,
                AverageMTTR = Math.Round(averageMTTR, 1),
                PreventiveSuccessRate = Math.Round(preventiveSuccessRate, 1),
                LowStockPartsCount = lowStockParts,
                TotalSparePartCost = Math.Round(totalSparePartCost, 2),
                StatusDistribution = new { Pending = pending, Assigned = assigned, InProgress = inProgress, Completed = completed }
            };
        }

        public async Task<string> GetAISynthesisAsync()
        {
            var stats = (dynamic)await GetDashboardStatsAsync();
            var totalEquipments = await _context.Equipments.CountAsync();
            var underMaintenance = await _context.Equipments.CountAsync(e => e.Status == "Maintenance");
            var broken = await _context.Equipments.CountAsync(e => e.Status == "Out of Order" || e.Status == "Broken");

            var sb = new StringBuilder();
            sb.AppendLine("### 🤖 Synthèse IA - Smart Maintenance AI");
            sb.AppendLine();
            sb.AppendLine($"**État global du parc :** Sur un total de {totalEquipments} équipements, **{underMaintenance}** sont actuellement en maintenance et **{broken}** sont déclarés hors service.");
            sb.AppendLine();
            
            sb.AppendLine("#### 📊 Analyse des performances :");
            sb.AppendLine($"- **MTTR (Temps moyen de réparation) :** Le temps moyen de résolution est actuellement de **{stats.AverageMTTR} minutes**. C'est un indicateur clé pour l'efficacité opérationnelle.");
            sb.AppendLine($"- **Taux de complétion préventif :** **{stats.PreventiveSuccessRate}%** des tâches préventives planifiées ont été réalisées. Un taux supérieur à 85% est recommandé pour minimiser les pannes imprévues.");
            sb.AppendLine($"- **Pièces de rechange :** **{stats.LowStockPartsCount}** pièces de rechange sont en alerte de stock bas. Le coût cumulé des pièces consommées sur les interventions s'élève à **{stats.TotalSparePartCost} €**.");
            sb.AppendLine();

            sb.AppendLine("#### 💡 Recommandations stratégiques :");
            if (stats.LowStockPartsCount > 0)
            {
                sb.AppendLine("- ⚠️ **Rupture imminente de stock :** Il est fortement conseillé de réapprovisionner les pièces en alerte pour éviter de bloquer les futures interventions critiques.");
            }
            if (stats.PreventiveSuccessRate < 80)
            {
                sb.AppendLine("- ⚙️ **Retard préventif :** Le taux de maintenance préventive est faible. Priorisez les tâches du calendrier préventif pour réduire le taux de panne global.");
            }
            else
            {
                sb.AppendLine("- ✅ **Maintenance préventive maîtrisée :** Excellent suivi du calendrier préventif. Continuez à ce rythme pour préserver la durée de vie des machines.");
            }
            if (broken > 0)
            {
                sb.AppendLine("- 🔧 **Intervention d'urgence requise :** Certains équipements sont hors service. Assurez-vous que des interventions curatives de haute priorité sont planifiées et assignées.");
            }

            return sb.ToString();
        }
    }
}
