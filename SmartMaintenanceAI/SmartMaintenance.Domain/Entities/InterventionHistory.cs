namespace SmartMaintenance.Domain.Entities
{
    public class InterventionHistory
    {
        public int Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
        
        public int InterventionId { get; set; }
        public Intervention Intervention { get; set; } = null!;
        
        public int ChangedByUserId { get; set; }
        public User ChangedByUser { get; set; } = null!;
    }
}
