namespace SmartMaintenance.Domain.Entities
{
    public class Intervention
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // "Pending", "Assigned", "InProgress", "Completed", "Cancelled"
        public string Priority { get; set; } = "Normal"; // "Low", "Normal", "High", "Critical"
        
        public DateTime? PlannedDate { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public int? EstimatedDurationMinutes { get; set; }
        public int? ActualDurationMinutes { get; set; }
        public string? Report { get; set; } // Rapport de fin d'intervention
        
        public int EquipmentId { get; set; }
        public Equipment Equipment { get; set; } = null!;
        
        public int? TechnicianId { get; set; }
        public Technician? Technician { get; set; }
        
        public int CreatedByUserId { get; set; }
        public User CreatedByUser { get; set; } = null!;
        
        public ICollection<InterventionHistory> History { get; set; } = new List<InterventionHistory>();
        public ICollection<InterventionSparePart> SparePartsUsed { get; set; } = new List<InterventionSparePart>();
    }
}

