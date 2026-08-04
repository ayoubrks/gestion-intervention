using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartMaintenance.Application.DTOs.SpareParts;
using SmartMaintenance.Application.Interfaces;

namespace SmartMaintenance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SparePartsController : ControllerBase
    {
        private readonly ISparePartService _sparePartService;

        public SparePartsController(ISparePartService sparePartService)
        {
            _sparePartService = sparePartService;
        }

        // GET: api/spareparts
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] bool? lowStockOnly = null)
        {
            var result = await _sparePartService.GetAllSparePartsAsync(page, pageSize, search, lowStockOnly);
            return Ok(result);
        }

        // GET: api/spareparts/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var sparePart = await _sparePartService.GetSparePartByIdAsync(id);
            if (sparePart == null) return NotFound(new { message = "Pièce non trouvée" });
            return Ok(sparePart);
        }

        // POST: api/spareparts
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create(CreateSparePartDto createDto)
        {
            try
            {
                var sparePart = await _sparePartService.CreateSparePartAsync(createDto);
                return CreatedAtAction(nameof(GetById), new { id = sparePart.Id }, sparePart);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/spareparts/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(int id, UpdateSparePartDto updateDto)
        {
            try
            {
                var sparePart = await _sparePartService.UpdateSparePartAsync(id, updateDto);
                return Ok(sparePart);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/spareparts/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _sparePartService.DeleteSparePartAsync(id);
                if (!result) return NotFound(new { message = "Pièce non trouvée" });
                return Ok(new { message = "Pièce supprimée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/spareparts/5/adjust-stock
        [HttpPost("{id}/adjust-stock")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> AdjustStock(int id, [FromBody] int quantityAdjustment)
        {
            try
            {
                var sparePart = await _sparePartService.AdjustStockAsync(id, quantityAdjustment);
                return Ok(sparePart);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/spareparts/interventions/5/consume
        [HttpPost("interventions/{interventionId}/consume")]
        [Authorize(Roles = "Admin,Manager,Technician")]
        public async Task<IActionResult> ConsumeInIntervention(int interventionId, ConsumeSparePartDto consumeDto)
        {
            try
            {
                await _sparePartService.ConsumeSparePartInInterventionAsync(interventionId, consumeDto);
                return Ok(new { message = "Pièce consommée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/spareparts/interventions/5
        [HttpGet("interventions/{interventionId}")]
        public async Task<IActionResult> GetPartsUsedInIntervention(int interventionId)
        {
            var parts = await _sparePartService.GetSparePartsUsedInInterventionAsync(interventionId);
            return Ok(parts);
        }
    }
}
