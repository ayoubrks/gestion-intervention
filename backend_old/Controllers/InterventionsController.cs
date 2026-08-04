using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InterventionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InterventionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/interventions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Intervention>>> GetInterventions()
        {
            return await _context.Interventions.OrderByDescending(i => i.CreatedAt).ToListAsync();
        }

        // GET: api/interventions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Intervention>> GetIntervention(int id)
        {
            var intervention = await _context.Interventions.FindAsync(id);

            if (intervention == null)
            {
                return NotFound();
            }

            return intervention;
        }

        // POST: api/interventions
        [HttpPost]
        public async Task<ActionResult<Intervention>> CreateIntervention(Intervention intervention)
        {
            intervention.CreatedAt = DateTime.UtcNow;
            _context.Interventions.Add(intervention);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetIntervention), new { id = intervention.Id }, intervention);
        }

        // PUT: api/interventions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateIntervention(int id, Intervention intervention)
        {
            if (id != intervention.Id)
            {
                return BadRequest();
            }

            intervention.UpdatedAt = DateTime.UtcNow;
            _context.Entry(intervention).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!InterventionExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/interventions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIntervention(int id)
        {
            var intervention = await _context.Interventions.FindAsync(id);
            if (intervention == null)
            {
                return NotFound();
            }

            _context.Interventions.Remove(intervention);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool InterventionExists(int id)
        {
            return _context.Interventions.Any(e => e.Id == id);
        }
    }
}
