namespace SmartMaintenance.Application.DTOs.PreventiveMaintenance
{
    public class PreventiveMaintenanceDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int FrequencyDays { get; set; }
        public DateTime NextDueDate { get; set; }
        public DateTime CreatedAt { get; set; }

        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; } = string.Empty;
        public string EquipmentSerialNumber { get; set; } = string.Empty;
    }
}
