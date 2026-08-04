namespace SmartMaintenance.Domain.Entities
{
    public class MaintenanceTask
    {
        public int Id { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string Status { get; set; } = "Pending"; // "Pending", "Completed", "Missed"
        public DateTime? ExecutedAt { get; set; }
        public string? Remarks { get; set; }
        
        public int PreventiveMaintenanceId { get; set; }
        public PreventiveMaintenance PreventiveMaintenance { get; set; } = null!;

        // Lien optionnel vers une Intervention générée
        public int? InterventionId { get; set; }
        public Intervention? Intervention { get; set; }
    }
}
