using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.Interventions;
using SmartMaintenance.Application.Interfaces;
using SmartMaintenance.Domain.Entities;
using SmartMaintenance.Infrastructure.Data;

namespace SmartMaintenance.Infrastructure.Services
{
    public class InterventionService : IInterventionService
    {
        private readonly AppDbContext _context;

        public InterventionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<InterventionDto>> GetAllInterventionsAsync(
            int page, int pageSize, string? search, string? status, string? priority, int? equipmentId, int? technicianId)
        {
            var query = _context.Interventions
                .Include(i => i.Equipment)
                .Include(i => i.Technician)
                    .ThenInclude(t => t.User)
                .Include(i => i.CreatedByUser)
                .Include(i => i.History)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(i => i.Title.ToLower().Contains(search) || i.Equipment.Name.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(i => i.Status == status);

            if (!string.IsNullOrWhiteSpace(priority))
                query = query.Where(i => i.Priority == priority);

            if (equipmentId.HasValue)
                query = query.Where(i => i.EquipmentId == equipmentId.Value);

            if (technicianId.HasValue)
                query = query.Where(i => i.TechnicianId == technicianId.Value);

            var totalCount = await query.CountAsync();

            var interventions = await query
                .OrderByDescending(i => i.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new InterventionDto
                {
                    Id = i.Id,
                    Title = i.Title,
                    Description = i.Description,
                    Status = i.Status,
                    Priority = i.Priority,
                    PlannedDate = i.PlannedDate,
                    CompletedAt = i.CompletedAt,
                    CreatedAt = i.CreatedAt,
                    EstimatedDurationMinutes = i.EstimatedDurationMinutes,
                    ActualDurationMinutes = i.ActualDurationMinutes,
                    Report = i.Report,
                    EquipmentId = i.EquipmentId,
                    EquipmentName = i.Equipment.Name,
                    EquipmentSerialNumber = i.Equipment.SerialNumber,
                    TechnicianId = i.TechnicianId,
                    TechnicianUserId = i.Technician != null ? i.Technician.UserId : null,
                    TechnicianName = i.Technician != null ? i.Technician.User.Username : null,
                    TechnicianSpecialization = i.Technician != null ? i.Technician.Specialization : null,
                    CreatedByUserId = i.CreatedByUserId,
                    CreatedByUsername = i.CreatedByUser.Username,
                    HistoryCount = i.History.Count
                })
                .ToListAsync();

            return new PagedResult<InterventionDto>
            {
                Items = interventions,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<InterventionDto?> GetInterventionByIdAsync(int id)
        {
            var intervention = await _context.Interventions
                .Include(i => i.Equipment)
                .Include(i => i.Technician)
                    .ThenInclude(t => t.User)
                .Include(i => i.CreatedByUser)
                .Include(i => i.History)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (intervention == null) return null;

            return new InterventionDto
            {
                Id = intervention.Id,
                Title = intervention.Title,
                Description = intervention.Description,
                Status = intervention.Status,
                Priority = intervention.Priority,
                PlannedDate = intervention.PlannedDate,
                CompletedAt = intervention.CompletedAt,
                CreatedAt = intervention.CreatedAt,
                EstimatedDurationMinutes = intervention.EstimatedDurationMinutes,
                ActualDurationMinutes = intervention.ActualDurationMinutes,
                Report = intervention.Report,
                EquipmentId = intervention.EquipmentId,
                EquipmentName = intervention.Equipment.Name,
                EquipmentSerialNumber = intervention.Equipment.SerialNumber,
                TechnicianId = intervention.TechnicianId,
                TechnicianUserId = intervention.Technician != null ? intervention.Technician.UserId : null,
                TechnicianName = intervention.Technician != null ? intervention.Technician.User.Username : null,
                TechnicianSpecialization = intervention.Technician != null ? intervention.Technician.Specialization : null,
                CreatedByUserId = intervention.CreatedByUserId,
                CreatedByUsername = intervention.CreatedByUser.Username,
                HistoryCount = intervention.History.Count
            };
        }

        public async Task<InterventionDto> CreateInterventionAsync(CreateInterventionDto createDto, int createdByUserId)
        {
            var equipment = await _context.Equipments.FindAsync(createDto.EquipmentId);
            if (equipment == null) throw new Exception("Équipement non trouvé");

            if (createDto.TechnicianId.HasValue)
            {
                var technician = await _context.Technicians.FirstOrDefaultAsync(t => t.UserId == createDto.TechnicianId.Value);
                if (technician == null) throw new Exception("Technicien non trouvé");
                createDto = new CreateInterventionDto
                {
                    Title = createDto.Title,
                    Description = createDto.Description,
                    Priority = createDto.Priority,
                    PlannedDate = createDto.PlannedDate,
                    EstimatedDurationMinutes = createDto.EstimatedDurationMinutes,
                    EquipmentId = createDto.EquipmentId,
                    TechnicianId = technician.Id
                };
            }

            var intervention = new Intervention
            {
                Title = createDto.Title,
                Description = createDto.Description,
                Priority = createDto.Priority,
                PlannedDate = createDto.PlannedDate,
                EstimatedDurationMinutes = createDto.EstimatedDurationMinutes,
                EquipmentId = createDto.EquipmentId,
                TechnicianId = createDto.TechnicianId,
                CreatedByUserId = createdByUserId,
                Status = createDto.TechnicianId.HasValue ? "Assigned" : "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Interventions.Add(intervention);

            // Add history entry
            var history = new InterventionHistory
            {
                Status = intervention.Status,
                Comment = "Création de l'intervention",
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = createdByUserId,
                Intervention = intervention
            };
            _context.InterventionHistories.Add(history);

            await _context.SaveChangesAsync();

            return await GetInterventionByIdAsync(intervention.Id) ?? throw new Exception("Erreur lors de la création");
        }

        public async Task<InterventionDto> UpdateInterventionAsync(int id, UpdateInterventionDto updateDto)
        {
            var intervention = await _context.Interventions.FindAsync(id);
            if (intervention == null) throw new Exception("Intervention non trouvée");

            if (intervention.Status == "Completed" || intervention.Status == "Cancelled")
                throw new Exception("Impossible de modifier une intervention terminée ou annulée");

            if (!string.IsNullOrWhiteSpace(updateDto.Title))
                intervention.Title = updateDto.Title;
            
            if (updateDto.Description != null)
                intervention.Description = updateDto.Description;

            if (!string.IsNullOrWhiteSpace(updateDto.Priority))
                intervention.Priority = updateDto.Priority;

            if (updateDto.PlannedDate.HasValue)
                intervention.PlannedDate = updateDto.PlannedDate.Value;

            if (updateDto.EstimatedDurationMinutes.HasValue)
                intervention.EstimatedDurationMinutes = updateDto.EstimatedDurationMinutes.Value;

            if (updateDto.EquipmentId.HasValue)
            {
                var equipmentExists = await _context.Equipments.AnyAsync(e => e.Id == updateDto.EquipmentId.Value);
                if (!equipmentExists) throw new Exception("Équipement non trouvé");
                intervention.EquipmentId = updateDto.EquipmentId.Value;
            }

            await _context.SaveChangesAsync();

            return await GetInterventionByIdAsync(intervention.Id) ?? throw new Exception("Erreur");
        }

        public async Task<bool> DeleteInterventionAsync(int id)
        {
            var intervention = await _context.Interventions.FindAsync(id);
            if (intervention == null) return false;

            _context.Interventions.Remove(intervention);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<InterventionDto> AssignTechnicianAsync(int id, AssignTechnicianDto assignDto, int currentUserId)
        {
            var intervention = await _context.Interventions.FindAsync(id);
            if (intervention == null) throw new Exception("Intervention non trouvée");

            if (intervention.Status == "Completed" || intervention.Status == "Cancelled")
                throw new Exception("Impossible d'assigner une intervention terminée ou annulée");

            var technician = await _context.Technicians.FirstOrDefaultAsync(t => t.UserId == assignDto.TechnicianId);
            if (technician == null) throw new Exception("Technicien non trouvé");

            intervention.TechnicianId = technician.Id;
            intervention.Status = "Assigned";

            var history = new InterventionHistory
            {
                Status = "Assigned",
                Comment = $"Assignation au technicien ID: {assignDto.TechnicianId}",
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = currentUserId,
                InterventionId = intervention.Id
            };
            _context.InterventionHistories.Add(history);

            await _context.SaveChangesAsync();
            return await GetInterventionByIdAsync(intervention.Id) ?? throw new Exception("Erreur");
        }

        public async Task<InterventionDto> StartInterventionAsync(int id, int currentUserId)
        {
            var intervention = await _context.Interventions.FindAsync(id);
            if (intervention == null) throw new Exception("Intervention non trouvée");

            if (intervention.Status != "Assigned")
                throw new Exception("L'intervention doit être assignée avant de démarrer");

            intervention.Status = "InProgress";

            var history = new InterventionHistory
            {
                Status = "InProgress",
                Comment = "Début de l'intervention",
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = currentUserId,
                InterventionId = intervention.Id
            };
            _context.InterventionHistories.Add(history);

            await _context.SaveChangesAsync();
            return await GetInterventionByIdAsync(intervention.Id) ?? throw new Exception("Erreur");
        }

        public async Task<InterventionDto> CompleteInterventionAsync(int id, CompleteInterventionDto completeDto, int currentUserId)
        {
            var intervention = await _context.Interventions.FindAsync(id);
            if (intervention == null) throw new Exception("Intervention non trouvée");

            if (intervention.Status != "InProgress")
                throw new Exception("L'intervention doit être en cours (InProgress) pour être terminée");

            intervention.Status = "Completed";
            intervention.Report = completeDto.Report;
            intervention.ActualDurationMinutes = completeDto.ActualDurationMinutes;
            intervention.CompletedAt = DateTime.UtcNow;

            var history = new InterventionHistory
            {
                Status = "Completed",
                Comment = "Clôture de l'intervention",
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = currentUserId,
                InterventionId = intervention.Id
            };
            _context.InterventionHistories.Add(history);

            await _context.SaveChangesAsync();
            return await GetInterventionByIdAsync(intervention.Id) ?? throw new Exception("Erreur");
        }

        public async Task<InterventionDto> CancelInterventionAsync(int id, string reason, int currentUserId)
        {
            var intervention = await _context.Interventions.FindAsync(id);
            if (intervention == null) throw new Exception("Intervention non trouvée");

            if (intervention.Status == "Completed" || intervention.Status == "Cancelled")
                throw new Exception("Intervention déjà terminée ou annulée");

            intervention.Status = "Cancelled";

            var history = new InterventionHistory
            {
                Status = "Cancelled",
                Comment = $"Annulation: {reason}",
                ChangedAt = DateTime.UtcNow,
                ChangedByUserId = currentUserId,
                InterventionId = intervention.Id
            };
            _context.InterventionHistories.Add(history);

            await _context.SaveChangesAsync();
            return await GetInterventionByIdAsync(intervention.Id) ?? throw new Exception("Erreur");
        }

        public async Task<List<InterventionHistoryDto>> GetInterventionHistoryAsync(int interventionId)
        {
            return await _context.InterventionHistories
                .Include(h => h.ChangedByUser)
                .Where(h => h.InterventionId == interventionId)
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new InterventionHistoryDto
                {
                    Id = h.Id,
                    Status = h.Status,
                    Comment = h.Comment,
                    ChangedAt = h.ChangedAt,
                    ChangedByUserId = h.ChangedByUserId,
                    ChangedByUsername = h.ChangedByUser.Username
                })
                .ToListAsync();
        }
    }
}
