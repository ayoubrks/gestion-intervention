using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.Interventions;

namespace SmartMaintenance.Application.Interfaces
{
    public interface IInterventionService
    {
        // --- CRUD Interventions ---
        Task<PagedResult<InterventionDto>> GetAllInterventionsAsync(
            int page, int pageSize, string? search, string? status, string? priority, int? equipmentId, int? technicianId);
        Task<InterventionDto?> GetInterventionByIdAsync(int id);
        Task<InterventionDto> CreateInterventionAsync(CreateInterventionDto createDto, int createdByUserId);
        Task<InterventionDto> UpdateInterventionAsync(int id, UpdateInterventionDto updateDto);
        Task<bool> DeleteInterventionAsync(int id);

        // --- Workflow Interventions ---
        Task<InterventionDto> AssignTechnicianAsync(int id, AssignTechnicianDto assignDto, int currentUserId);
        Task<InterventionDto> StartInterventionAsync(int id, int currentUserId);
        Task<InterventionDto> CompleteInterventionAsync(int id, CompleteInterventionDto completeDto, int currentUserId);
        Task<InterventionDto> CancelInterventionAsync(int id, string reason, int currentUserId);

        // --- Historique ---
        Task<List<InterventionHistoryDto>> GetInterventionHistoryAsync(int interventionId);
    }
}
