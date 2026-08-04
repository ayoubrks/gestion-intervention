namespace SmartMaintenance.Domain.Entities
{
    public class Equipment
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Status { get; set; } = "Operational"; // "Operational", "UnderMaintenance", "Broken"
        
        public DateTime? InstallationDate { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public int CategoryId { get; set; }
        public EquipmentCategory Category { get; set; } = null!;
        
        public ICollection<Intervention> Interventions { get; set; } = new List<Intervention>();
        public ICollection<PreventiveMaintenance> PreventiveMaintenances { get; set; } = new List<PreventiveMaintenance>();
    }
}
