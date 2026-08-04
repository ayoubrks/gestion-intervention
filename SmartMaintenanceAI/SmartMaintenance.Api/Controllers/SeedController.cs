using Microsoft.AspNetCore.Mvc;
using SmartMaintenance.Infrastructure.Data;

namespace SmartMaintenance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SeedController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/seed
        [HttpPost]
        public async Task<IActionResult> SeedData()
        {
            try
            {
                await DbSeeder.SeedAsync(_context);
                return Ok(new { message = "Données de démonstration initialisées avec succès (3+ entrées par module) !" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Erreur d'initialisation : " + ex.Message });
            }
        }
    }
}
