namespace SmartMaintenance.Domain.Entities
{
    public class PreventiveMaintenance
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int FrequencyDays { get; set; }
        public DateTime NextDueDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public int EquipmentId { get; set; }
        public Equipment Equipment { get; set; } = null!;
        
        public ICollection<MaintenanceTask> Tasks { get; set; } = new List<MaintenanceTask>();
    }
}
