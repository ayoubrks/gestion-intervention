using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.PreventiveMaintenance;
using SmartMaintenance.Application.Interfaces;
using SmartMaintenance.Domain.Entities;
using SmartMaintenance.Infrastructure.Data;

namespace SmartMaintenance.Infrastructure.Services
{
    public class PreventiveMaintenanceService : IPreventiveMaintenanceService
    {
        private readonly AppDbContext _context;

        public PreventiveMaintenanceService(AppDbContext context)
        {
            _context = context;
        }

        private async Task DeduplicateTasksAndInterventionsAsync()
        {
            try
            {
                // Remove duplicate pending tasks (same plan & same scheduled date)
                var pendingTasks = await _context.MaintenanceTasks
                    .Where(t => t.Status == "Pending")
                    .ToListAsync();

                var duplicateTasks = pendingTasks
                    .GroupBy(t => new { t.PreventiveMaintenanceId, t.ScheduledDate })
                    .Where(g => g.Count() > 1)
                    .SelectMany(g => g.OrderBy(t => t.Id).Skip(1))
                    .ToList();

                if (duplicateTasks.Any())
                {
                    _context.MaintenanceTasks.RemoveRange(duplicateTasks);
                }

                // Remove duplicate pending interventions created from preventive tasks
                var pendingInterventions = await _context.Interventions
                    .Where(i => i.Status == "Pending" && i.Title.StartsWith("[PREV]"))
                    .ToListAsync();

                var duplicateInterventions = pendingInterventions
                    .GroupBy(i => new { i.Title, i.EquipmentId, i.PlannedDate })
                    .Where(g => g.Count() > 1)
                    .SelectMany(g => g.OrderBy(i => i.Id).Skip(1))
                    .ToList();

                if (duplicateInterventions.Any())
                {
                    _context.Interventions.RemoveRange(duplicateInterventions);
                }

                if (duplicateTasks.Any() || duplicateInterventions.Any())
                {
                    await _context.SaveChangesAsync();
                }
            }
            catch
            {
                // Ignore any temporary deduplication errors
            }
        }

        public async Task<PagedResult<PreventiveMaintenanceDto>> GetAllPlansAsync(int page, int pageSize, int? equipmentId)
        {
            var query = _context.PreventiveMaintenances
                .Include(p => p.Equipment)
                .AsQueryable();

            if (equipmentId.HasValue)
                query = query.Where(p => p.EquipmentId == equipmentId.Value);

            var totalCount = await query.CountAsync();

            var plans = await query
                .OrderBy(p => p.NextDueDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new PreventiveMaintenanceDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    FrequencyDays = p.FrequencyDays,
                    NextDueDate = p.NextDueDate,
                    CreatedAt = p.CreatedAt,
                    EquipmentId = p.EquipmentId,
                    EquipmentName = p.Equipment.Name,
                    EquipmentSerialNumber = p.Equipment.SerialNumber
                })
                .ToListAsync();

            return new PagedResult<PreventiveMaintenanceDto>
            {
                Items = plans,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<PreventiveMaintenanceDto?> GetPlanByIdAsync(int id)
        {
            var p = await _context.PreventiveMaintenances
                .Include(pm => pm.Equipment)
                .FirstOrDefaultAsync(pm => pm.Id == id);

            if (p == null) return null;

            return new PreventiveMaintenanceDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                FrequencyDays = p.FrequencyDays,
                NextDueDate = p.NextDueDate,
                CreatedAt = p.CreatedAt,
                EquipmentId = p.EquipmentId,
                EquipmentName = p.Equipment.Name,
                EquipmentSerialNumber = p.Equipment.SerialNumber
            };
        }

        public async Task<PreventiveMaintenanceDto> CreatePlanAsync(CreatePreventiveMaintenanceDto createDto)
        {
            var equipment = await _context.Equipments.FindAsync(createDto.EquipmentId);
            if (equipment == null) throw new Exception("Équipement non trouvé");

            var plan = new PreventiveMaintenance
            {
                Title = createDto.Title,
                Description = createDto.Description,
                FrequencyDays = createDto.FrequencyDays,
                NextDueDate = createDto.NextDueDate,
                EquipmentId = createDto.EquipmentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.PreventiveMaintenances.Add(plan);
            await _context.SaveChangesAsync();

            // Créer automatiquement la première tâche
            var task = new MaintenanceTask
            {
                PreventiveMaintenanceId = plan.Id,
                ScheduledDate = plan.NextDueDate,
                Status = "Pending"
            };
            _context.MaintenanceTasks.Add(task);
            await _context.SaveChangesAsync();

            return await GetPlanByIdAsync(plan.Id) ?? throw new Exception("Erreur");
        }

        public async Task<bool> DeletePlanAsync(int id)
        {
            var plan = await _context.PreventiveMaintenances
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (plan == null) return false;

            _context.PreventiveMaintenances.Remove(plan);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResult<MaintenanceTaskDto>> GetAllTasksAsync(int page, int pageSize, string? status, int? equipmentId)
        {
            await DeduplicateTasksAndInterventionsAsync();

            var query = _context.MaintenanceTasks
                .Include(t => t.PreventiveMaintenance)
                    .ThenInclude(p => p.Equipment)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(t => t.Status == status);

            if (equipmentId.HasValue)
                query = query.Where(t => t.PreventiveMaintenance.EquipmentId == equipmentId.Value);

            var totalCount = await query.CountAsync();

            var tasks = await query
                .OrderBy(t => t.ScheduledDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new MaintenanceTaskDto
                {
                    Id = t.Id,
                    ScheduledDate = t.ScheduledDate,
                    Status = t.Status,
                    ExecutedAt = t.ExecutedAt,
                    Remarks = t.Remarks,
                    PreventiveMaintenanceId = t.PreventiveMaintenanceId,
                    PreventiveMaintenanceTitle = t.PreventiveMaintenance.Title,
                    EquipmentId = t.PreventiveMaintenance.EquipmentId,
                    EquipmentName = t.PreventiveMaintenance.Equipment.Name,
                    InterventionId = t.InterventionId
                })
                .ToListAsync();

            return new PagedResult<MaintenanceTaskDto>
            {
                Items = tasks,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<MaintenanceTaskDto> GenerateTasksForPlanAsync(int planId, int numberOfTasks)
        {
            var plan = await _context.PreventiveMaintenances
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == planId);

            if (plan == null) throw new Exception("Plan non trouvé");

            var lastTaskDate = plan.Tasks.Any() ? plan.Tasks.Max(t => t.ScheduledDate) : plan.NextDueDate;

            for (int i = 0; i < numberOfTasks; i++)
            {
                lastTaskDate = lastTaskDate.AddDays(plan.FrequencyDays);
                bool exists = await _context.MaintenanceTasks.AnyAsync(t => 
                    t.PreventiveMaintenanceId == plan.Id && 
                    t.ScheduledDate == lastTaskDate
                );

                if (!exists)
                {
                    _context.MaintenanceTasks.Add(new MaintenanceTask
                    {
                        PreventiveMaintenanceId = plan.Id,
                        ScheduledDate = lastTaskDate,
                        Status = "Pending"
                    });
                }
            }

            plan.NextDueDate = plan.Tasks.Where(t => t.Status == "Pending").OrderBy(t => t.ScheduledDate).FirstOrDefault()?.ScheduledDate ?? lastTaskDate;

            await _context.SaveChangesAsync();

            return (await GetAllTasksAsync(1, 1, null, null)).Items.First(); 
        }

        private async Task<MaintenanceTaskDto> GetTaskDtoByIdAsync(int taskId)
        {
            var t = await _context.MaintenanceTasks
                .Include(t => t.PreventiveMaintenance)
                    .ThenInclude(p => p.Equipment)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (t == null) throw new Exception("Tâche non trouvée");

            return new MaintenanceTaskDto
            {
                Id = t.Id,
                ScheduledDate = t.ScheduledDate,
                Status = t.Status,
                ExecutedAt = t.ExecutedAt,
                Remarks = t.Remarks,
                PreventiveMaintenanceId = t.PreventiveMaintenanceId,
                PreventiveMaintenanceTitle = t.PreventiveMaintenance.Title,
                EquipmentId = t.PreventiveMaintenance.EquipmentId,
                EquipmentName = t.PreventiveMaintenance.Equipment.Name,
                InterventionId = t.InterventionId
            };
        }

        public async Task<MaintenanceTaskDto> CompleteTaskAsync(int taskId, CompleteMaintenanceTaskDto completeDto)
        {
            var task = await _context.MaintenanceTasks
                .Include(t => t.PreventiveMaintenance)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null) throw new Exception("Tâche non trouvée");
            if (task.Status != "Pending") throw new Exception("Tâche déjà complétée ou annulée");

            task.Status = "Completed";
            task.ExecutedAt = DateTime.UtcNow;
            task.Remarks = completeDto.Remarks;

            // Update NextDueDate on Plan
            var nextTask = await _context.MaintenanceTasks
                .Where(t => t.PreventiveMaintenanceId == task.PreventiveMaintenanceId && t.Status == "Pending" && t.Id != taskId)
                .OrderBy(t => t.ScheduledDate)
                .FirstOrDefaultAsync();

            if (nextTask != null)
            {
                task.PreventiveMaintenance.NextDueDate = nextTask.ScheduledDate;
            }
            else
            {
                var newDate = task.PreventiveMaintenance.NextDueDate.AddDays(task.PreventiveMaintenance.FrequencyDays);
                task.PreventiveMaintenance.NextDueDate = newDate;

                bool pendingExists = await _context.MaintenanceTasks.AnyAsync(t => 
                    t.PreventiveMaintenanceId == task.PreventiveMaintenanceId && 
                    t.ScheduledDate == newDate && 
                    t.Status == "Pending"
                );

                if (!pendingExists)
                {
                    _context.MaintenanceTasks.Add(new MaintenanceTask
                    {
                        PreventiveMaintenanceId = task.PreventiveMaintenanceId,
                        ScheduledDate = newDate,
                        Status = "Pending"
                    });
                }
            }

            await _context.SaveChangesAsync();

            return await GetTaskDtoByIdAsync(taskId);
        }

        public async Task<MaintenanceTaskDto> ConvertTaskToInterventionAsync(int taskId, int currentUserId)
        {
            var task = await _context.MaintenanceTasks
                .Include(t => t.PreventiveMaintenance)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null) throw new Exception("Tâche non trouvée");
            if (task.Status != "Pending" || task.InterventionId.HasValue)
                throw new Exception("Cette tâche n'est plus en attente ou a déjà été convertie en intervention.");

            // Check if an existing pending intervention with exact same title & equipment exists to prevent duplication
            var existingIntervention = await _context.Interventions.FirstOrDefaultAsync(i => 
                i.EquipmentId == task.PreventiveMaintenance.EquipmentId &&
                i.Title == $"[PREV] {task.PreventiveMaintenance.Title}" &&
                i.PlannedDate == task.ScheduledDate &&
                i.Status == "Pending"
            );

            Intervention intervention;
            if (existingIntervention != null)
            {
                intervention = existingIntervention;
            }
            else
            {
                intervention = new Intervention
                {
                    Title = $"[PREV] {task.PreventiveMaintenance.Title}",
                    Description = $"Maintenance préventive générée depuis le plan {task.PreventiveMaintenanceId}.\n{task.PreventiveMaintenance.Description}",
                    Priority = "Normal",
                    EquipmentId = task.PreventiveMaintenance.EquipmentId,
                    CreatedByUserId = currentUserId,
                    PlannedDate = task.ScheduledDate,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Interventions.Add(intervention);

                var history = new InterventionHistory
                {
                    Status = "Pending",
                    Comment = "Génération depuis une tâche préventive",
                    ChangedAt = DateTime.UtcNow,
                    ChangedByUserId = currentUserId,
                    Intervention = intervention
                };
                _context.InterventionHistories.Add(history);

                await _context.SaveChangesAsync();
            }

            task.InterventionId = intervention.Id;
            task.Status = "Completed";
            task.ExecutedAt = DateTime.UtcNow;
            task.Remarks = "Convertie en intervention standard (ID: " + intervention.Id + ")";

            // Update plan NextDueDate
            var nextTask = await _context.MaintenanceTasks
                .Where(t => t.PreventiveMaintenanceId == task.PreventiveMaintenanceId && t.Status == "Pending" && t.Id != taskId)
                .OrderBy(t => t.ScheduledDate)
                .FirstOrDefaultAsync();

            if (nextTask != null)
            {
                task.PreventiveMaintenance.NextDueDate = nextTask.ScheduledDate;
            }
            else
            {
                var newDate = task.PreventiveMaintenance.NextDueDate.AddDays(task.PreventiveMaintenance.FrequencyDays);
                task.PreventiveMaintenance.NextDueDate = newDate;

                bool pendingExists = await _context.MaintenanceTasks.AnyAsync(t => 
                    t.PreventiveMaintenanceId == task.PreventiveMaintenanceId && 
                    t.ScheduledDate == newDate && 
                    t.Status == "Pending"
                );

                if (!pendingExists)
                {
                    _context.MaintenanceTasks.Add(new MaintenanceTask
                    {
                        PreventiveMaintenanceId = task.PreventiveMaintenanceId,
                        ScheduledDate = newDate,
                        Status = "Pending"
                    });
                }
            }

            await _context.SaveChangesAsync();

            return await GetTaskDtoByIdAsync(taskId);
        }

        public async Task<bool> DeleteTaskAsync(int id)
        {
            var task = await _context.MaintenanceTasks.FindAsync(id);
            if (task == null) return false;

            _context.MaintenanceTasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
