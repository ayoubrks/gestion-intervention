using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartMaintenance.Application.DTOs.Equipments;
using SmartMaintenance.Application.Interfaces;

namespace SmartMaintenance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Authentification requise pour toutes les routes
    public class EquipmentsController : ControllerBase
    {
        private readonly IEquipmentService _equipmentService;

        public EquipmentsController(IEquipmentService equipmentService)
        {
            _equipmentService = equipmentService;
        }

        // ==========================================
        // ENDPOINTS ÉQUIPEMENTS
        // ==========================================

        // GET: api/equipments?page=1&pageSize=10&search=pompe&status=Operational&categoryId=1
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] int? categoryId = null)
        {
            var result = await _equipmentService.GetAllEquipmentsAsync(page, pageSize, search, status, categoryId);
            return Ok(result);
        }

        // GET: api/equipments/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var equipment = await _equipmentService.GetEquipmentByIdAsync(id);
            if (equipment == null) return NotFound(new { message = "Équipement non trouvé" });
            return Ok(equipment);
        }

        // POST: api/equipments
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(CreateEquipmentDto createDto)
        {
            try
            {
                var equipment = await _equipmentService.CreateEquipmentAsync(createDto);
                return CreatedAtAction(nameof(GetById), new { id = equipment.Id }, equipment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/equipments/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, UpdateEquipmentDto updateDto)
        {
            try
            {
                var equipment = await _equipmentService.UpdateEquipmentAsync(id, updateDto);
                return Ok(equipment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/equipments/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _equipmentService.DeleteEquipmentAsync(id);
                if (!result) return NotFound(new { message = "Équipement non trouvé" });
                return Ok(new { message = "Équipement supprimé avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ==========================================
        // ENDPOINTS CATÉGORIES
        // ==========================================

        // GET: api/equipments/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _equipmentService.GetAllCategoriesAsync();
            return Ok(categories);
        }

        // GET: api/equipments/categories/5
        [HttpGet("categories/{id}")]
        public async Task<IActionResult> GetCategoryById(int id)
        {
            var category = await _equipmentService.GetCategoryByIdAsync(id);
            if (category == null) return NotFound(new { message = "Catégorie non trouvée" });
            return Ok(category);
        }

        // POST: api/equipments/categories
        [HttpPost("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory(CreateCategoryDto createDto)
        {
            try
            {
                var category = await _equipmentService.CreateCategoryAsync(createDto);
                return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/equipments/categories/5
        [HttpPut("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, CreateCategoryDto updateDto)
        {
            try
            {
                var category = await _equipmentService.UpdateCategoryAsync(id, updateDto);
                return Ok(category);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/equipments/categories/5
        [HttpDelete("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var result = await _equipmentService.DeleteCategoryAsync(id);
                if (!result) return NotFound(new { message = "Catégorie non trouvée" });
                return Ok(new { message = "Catégorie supprimée avec succès" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ==========================================
        // ENDPOINT STATISTIQUES
        // ==========================================

        // GET: api/equipments/stats
        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _equipmentService.GetEquipmentStatsAsync();
            return Ok(stats);
        }
    }
}
