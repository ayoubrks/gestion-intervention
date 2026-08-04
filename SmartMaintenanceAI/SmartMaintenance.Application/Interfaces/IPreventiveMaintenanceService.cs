using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.PreventiveMaintenance;

namespace SmartMaintenance.Application.Interfaces
{
    public interface IPreventiveMaintenanceService
    {
        // --- Plans de maintenance préventive ---
        Task<PagedResult<PreventiveMaintenanceDto>> GetAllPlansAsync(int page, int pageSize, int? equipmentId);
        Task<PreventiveMaintenanceDto?> GetPlanByIdAsync(int id);
        Task<PreventiveMaintenanceDto> CreatePlanAsync(CreatePreventiveMaintenanceDto createDto);
        Task<bool> DeletePlanAsync(int id);

        // --- Tâches générées ---
        Task<PagedResult<MaintenanceTaskDto>> GetAllTasksAsync(int page, int pageSize, string? status, int? equipmentId);
        Task<MaintenanceTaskDto> GenerateTasksForPlanAsync(int planId, int numberOfTasks);
        Task<MaintenanceTaskDto> CompleteTaskAsync(int taskId, CompleteMaintenanceTaskDto completeDto);
        Task<MaintenanceTaskDto> ConvertTaskToInterventionAsync(int taskId, int currentUserId);
    }
}
