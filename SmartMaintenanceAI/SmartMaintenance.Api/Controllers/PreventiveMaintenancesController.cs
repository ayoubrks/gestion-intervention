using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartMaintenance.Application.DTOs.PreventiveMaintenance;
using SmartMaintenance.Application.Interfaces;
using System.Security.Claims;

namespace SmartMaintenance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PreventiveMaintenancesController : ControllerBase
    {
        private readonly IPreventiveMaintenanceService _preventiveService;

        public PreventiveMaintenancesController(IPreventiveMaintenanceService preventiveService)
        {
            _preventiveService = preventiveService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                return userId;
            throw new UnauthorizedAccessException("ID utilisateur introuvable dans le token.");
        }

        // ==========================================
        // PLANS DE MAINTENANCE
        // ==========================================

        [HttpGet("plans")]
        public async Task<IActionResult> GetAllPlans(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? equipmentId = null)
        {
            var result = await _preventiveService.GetAllPlansAsync(page, pageSize, equipmentId);
            return Ok(result);
        }

        [HttpGet("plans/{id}")]
        public async Task<IActionResult> GetPlanById(int id)
        {
            var plan = await _preventiveService.GetPlanByIdAsync(id);
            if (plan == null) return NotFound(new { message = "Plan non trouvé" });
            return Ok(plan);
        }

        [HttpPost("plans")]
        [Authorize]
        public async Task<IActionResult> CreatePlan(CreatePreventiveMaintenanceDto createDto)
        {
            try
            {
                var plan = await _preventiveService.CreatePlanAsync(createDto);
                return CreatedAtAction(nameof(GetPlanById), new { id = plan.Id }, plan);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("plans/{id}")]
        [Authorize]
        public async Task<IActionResult> DeletePlan(int id)
        {
            var result = await _preventiveService.DeletePlanAsync(id);
            if (!result) return NotFound(new { message = "Plan non trouvé" });
            return Ok(new { message = "Plan supprimé avec succès" });
        }

        [HttpPost("plans/{id}/generate-tasks")]
        [Authorize]
        public async Task<IActionResult> GenerateTasks(int id, [FromQuery] int count = 1)
        {
            try
            {
                await _preventiveService.GenerateTasksForPlanAsync(id, count);
                return Ok(new { message = $"{count} tâche(s) générée(s) avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ==========================================
        // TÂCHES DE MAINTENANCE
        // ==========================================

        [HttpGet("tasks")]
        public async Task<IActionResult> GetAllTasks(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] int? equipmentId = null)
        {
            var result = await _preventiveService.GetAllTasksAsync(page, pageSize, status, equipmentId);
            return Ok(result);
        }

        [HttpPost("tasks/{id}/complete")]
        [Authorize]
        public async Task<IActionResult> CompleteTask(int id, CompleteMaintenanceTaskDto completeDto)
        {
            try
            {
                var task = await _preventiveService.CompleteTaskAsync(id, completeDto);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("tasks/{id}/convert-to-intervention")]
        [Authorize]
        public async Task<IActionResult> ConvertToIntervention(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var task = await _preventiveService.ConvertTaskToInterventionAsync(id, userId);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("tasks/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var result = await _preventiveService.DeleteTaskAsync(id);
            if (!result) return NotFound(new { message = "Tâche non trouvée" });
            return Ok(new { message = "Tâche supprimée avec succès" });
        }
    }
}
