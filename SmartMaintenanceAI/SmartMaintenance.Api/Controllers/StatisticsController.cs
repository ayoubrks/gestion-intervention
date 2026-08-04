using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartMaintenance.Application.Interfaces;

namespace SmartMaintenance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statsService;

        public StatisticsController(IStatisticsService statsService)
        {
            _statsService = statsService;
        }

        // GET: api/statistics/dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var stats = await _statsService.GetDashboardStatsAsync();
            return Ok(stats);
        }

        // GET: api/statistics/ai-synthesis
        [HttpGet("ai-synthesis")]
        public async Task<IActionResult> GetAISynthesis()
        {
            var synthesis = await _statsService.GetAISynthesisAsync();
            return Ok(new { synthesis });
        }
    }
}
