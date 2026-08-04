namespace SmartMaintenance.Application.DTOs.PreventiveMaintenance
{
    public class MaintenanceTaskDto
    {
        public int Id { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ExecutedAt { get; set; }
        public string? Remarks { get; set; }
        
        public int PreventiveMaintenanceId { get; set; }
        public string PreventiveMaintenanceTitle { get; set; } = string.Empty;
        
        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; } = string.Empty;

        public int? InterventionId { get; set; }
    }
}
