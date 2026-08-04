using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartMaintenance.Application.DTOs.Interventions;
using SmartMaintenance.Application.Interfaces;
using System.Security.Claims;

namespace SmartMaintenance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class InterventionsController : ControllerBase
    {
        private readonly IInterventionService _interventionService;

        public InterventionsController(IInterventionService interventionService)
        {
            _interventionService = interventionService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                return userId;
            throw new UnauthorizedAccessException("ID utilisateur introuvable dans le token.");
        }

        // GET: api/interventions
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] string? priority = null,
            [FromQuery] int? equipmentId = null,
            [FromQuery] int? technicianId = null)
        {
            var result = await _interventionService.GetAllInterventionsAsync(page, pageSize, search, status, priority, equipmentId, technicianId);
            return Ok(result);
        }

        // GET: api/interventions/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var intervention = await _interventionService.GetInterventionByIdAsync(id);
            if (intervention == null) return NotFound(new { message = "Intervention non trouvée" });
            return Ok(intervention);
        }

        // POST: api/interventions
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create(CreateInterventionDto createDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var intervention = await _interventionService.CreateInterventionAsync(createDto, userId);
                return CreatedAtAction(nameof(GetById), new { id = intervention.Id }, intervention);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/interventions/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(int id, UpdateInterventionDto updateDto)
        {
            try
            {
                var intervention = await _interventionService.UpdateInterventionAsync(id, updateDto);
                return Ok(intervention);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/interventions/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _interventionService.DeleteInterventionAsync(id);
            if (!result) return NotFound(new { message = "Intervention non trouvée" });
            return Ok(new { message = "Intervention supprimée avec succès" });
        }

        // POST: api/interventions/5/assign
        [HttpPost("{id}/assign")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> AssignTechnician(int id, AssignTechnicianDto assignDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var intervention = await _interventionService.AssignTechnicianAsync(id, assignDto, userId);
                return Ok(intervention);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/interventions/5/start
        [HttpPost("{id}/start")]
        [Authorize(Roles = "Admin,Manager,Technician")]
        public async Task<IActionResult> Start(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var intervention = await _interventionService.StartInterventionAsync(id, userId);
                return Ok(intervention);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/interventions/5/complete
        [HttpPost("{id}/complete")]
        [Authorize(Roles = "Admin,Manager,Technician")]
        public async Task<IActionResult> Complete(int id, CompleteInterventionDto completeDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var intervention = await _interventionService.CompleteInterventionAsync(id, completeDto, userId);
                return Ok(intervention);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/interventions/5/cancel
        [HttpPost("{id}/cancel")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Cancel(int id, [FromBody] string reason)
        {
            try
            {
                var userId = GetCurrentUserId();
                var intervention = await _interventionService.CancelInterventionAsync(id, reason, userId);
                return Ok(intervention);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/interventions/5/history
        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetHistory(int id)
        {
            var history = await _interventionService.GetInterventionHistoryAsync(id);
            return Ok(history);
        }
    }
}
