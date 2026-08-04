namespace SmartMaintenance.Domain.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public string Action { get; set; } = string.Empty; // "Created", "Updated", "Deleted"
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        public int? UserId { get; set; } // The user who performed the action
    }
}
