using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Infrastructure.Data;
using SmartMaintenance.Domain.Entities;
using System.Security.Claims;

namespace SmartMaintenance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                return userId;
            return 1; // Default fallback
        }

        // GET: api/notifications
        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = GetCurrentUserId();

            // Générer dynamiquement des alertes systèmes réelles si la liste est pauvre
            await GenerateLiveSystemAlertsAsync(userId);

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .Select(n => new
                {
                    n.Id,
                    n.Message,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // POST: api/notifications/1/read
        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetCurrentUserId();
            var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Marqué comme lu" });
        }

        // POST: api/notifications/read-all
        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();
            var unread = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
            foreach (var n in unread)
            {
                n.IsRead = true;
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Toutes les notifications ont été marquées comme lues" });
        }

        private async Task GenerateLiveSystemAlertsAsync(int userId)
        {
            // 1. Détecter les pièces en alerte stock bas
            var lowStockParts = await _context.SpareParts
                .Where(sp => sp.StockQuantity <= sp.MinimumThreshold)
                .ToListAsync();

            foreach (var part in lowStockParts)
            {
                string msg = $"⚠️ Alerte Stock Bas : La pièce '{part.Name}' ({part.Reference}) a un stock de {part.StockQuantity} (seuil min: {part.MinimumThreshold}).";
                bool exists = await _context.Notifications.AnyAsync(n => n.UserId == userId && n.Message == msg);
                if (!exists)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = userId,
                        Message = msg,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // 2. Détecter les interventions en attente d'assignation
            var pendingInterventions = await _context.Interventions
                .Where(i => i.Status == "Pending")
                .Take(3)
                .ToListAsync();

            foreach (var inv in pendingInterventions)
            {
                string msg = $"🔧 Nouvelle Intervention : '{inv.Title}' nécessite une assignation de technicien.";
                bool exists = await _context.Notifications.AnyAsync(n => n.UserId == userId && n.Message == msg);
                if (!exists)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = userId,
                        Message = msg,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // 3. Détecter les tâches préventives dues dans les 7 prochains jours
            var duePreventives = await _context.MaintenanceTasks
                .Include(t => t.PreventiveMaintenance)
                .Where(t => t.Status == "Pending" && t.ScheduledDate <= DateTime.UtcNow.AddDays(7))
                .Take(3)
                .ToListAsync();

            foreach (var task in duePreventives)
            {
                if (task.PreventiveMaintenance != null)
                {
                    string msg = $"📅 Maintenance Préventive : Échéance proche pour '{task.PreventiveMaintenance.Title}'.";
                    bool exists = await _context.Notifications.AnyAsync(n => n.UserId == userId && n.Message == msg);
                    if (!exists)
                    {
                        _context.Notifications.Add(new Notification
                        {
                            UserId = userId,
                            Message = msg,
                            IsRead = false,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
