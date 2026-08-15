using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Application.Interfaces;
using SmartMaintenance.Infrastructure.Data;

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

        public async Task<object> GetAISynthesisAsync()
        {
            var totalEquipments = await _context.Equipments.CountAsync();
            var underMaintenance = await _context.Equipments.CountAsync(e => e.Status == "Maintenance");
            var broken = await _context.Equipments.CountAsync(e => e.Status == "Out of Order" || e.Status == "Broken");
            var active = await _context.Equipments.CountAsync(e => e.Status == "Active");

            var totalInterventions = await _context.Interventions.CountAsync();
            var pending = await _context.Interventions.CountAsync(i => i.Status == "Pending");
            var assigned = await _context.Interventions.CountAsync(i => i.Status == "Assigned");
            var inProgress = await _context.Interventions.CountAsync(i => i.Status == "InProgress");
            var completed = await _context.Interventions.CountAsync(i => i.Status == "Completed");
            var cancelled = await _context.Interventions.CountAsync(i => i.Status == "Cancelled");

            var completedInterventions = await _context.Interventions
                .Where(i => i.Status == "Completed" && i.ActualDurationMinutes.HasValue)
                .ToListAsync();
            var avgMTTR = completedInterventions.Any()
                ? Math.Round(completedInterventions.Average(i => i.ActualDurationMinutes!.Value), 0)
                : 0;

            var totalPreventiveTasks = await _context.MaintenanceTasks.CountAsync();
            var completedPreventive = await _context.MaintenanceTasks.CountAsync(t => t.Status == "Completed");
            var preventiveRate = totalPreventiveTasks > 0
                ? Math.Round((double)completedPreventive / totalPreventiveTasks * 100, 1)
                : 0;

            var lowStockCount = await _context.SpareParts.CountAsync(s => s.StockQuantity <= s.MinimumThreshold);
            var lowStockParts = await _context.SpareParts
                .Where(s => s.StockQuantity <= s.MinimumThreshold)
                .Select(s => new { s.Name, s.StockQuantity, s.MinimumThreshold })
                .ToListAsync();

            var totalSparePartCost = await _context.InterventionSpareParts
                .Join(_context.SpareParts, isp => isp.SparePartId, sp => sp.Id, (isp, sp) => new { isp.QuantityUsed, sp.UnitCost })
                .SumAsync(x => x.QuantityUsed * x.UnitCost);

            // Build recommendations
            var recommendations = new List<object>();

            if (lowStockCount > 0)
            {
                recommendations.Add(new
                {
                    type = "warning",
                    title = "Rupture imminente de stock",
                    description = $"{lowStockCount} pièce(s) en alerte. Réapprovisionnez pour éviter de bloquer les interventions critiques.",
                    items = lowStockParts.Select(p => $"{p.Name} : {p.StockQuantity}/{p.MinimumThreshold}").ToList()
                });
            }

            if (preventiveRate < 80)
            {
                recommendations.Add(new
                {
                    type = "warning",
                    title = "Retard préventif",
                    description = $"Le taux de maintenance préventive est à {preventiveRate}%. Priorisez les tâches du calendrier pour réduire les pannes.",
                    items = new List<string>()
                });
            }
            else
            {
                recommendations.Add(new
                {
                    type = "success",
                    title = "Maintenance préventive maîtrisée",
                    description = $"Excellent suivi à {preventiveRate}%. Continuez à ce rythme pour préserver la durée de vie des machines.",
                    items = new List<string>()
                });
            }

            if (broken > 0)
            {
                recommendations.Add(new
                {
                    type = "danger",
                    title = "Équipements hors service",
                    description = $"{broken} équipement(s) hors service. Planifiez des interventions curatives de haute priorité.",
                    items = new List<string>()
                });
            }

            if (pending > 3)
            {
                recommendations.Add(new
                {
                    type = "info",
                    title = "Interventions en attente",
                    description = $"{pending} interventions en attente d'assignation. Assignez un technicien pour accélérer le traitement.",
                    items = new List<string>()
                });
            }

            return new
            {
                parc = new
                {
                    total = totalEquipments,
                    active,
                    maintenance = underMaintenance,
                    horsService = broken
                },
                interventions = new
                {
                    total = totalInterventions,
                    pending,
                    assigned,
                    inProgress,
                    completed,
                    cancelled
                },
                performance = new
                {
                    mttr = avgMTTR,
                    preventiveRate,
                    lowStockCount,
                    totalSparePartCost = Math.Round(totalSparePartCost, 2)
                },
                recommendations
            };
        }
    }
}
