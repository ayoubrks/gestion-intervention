namespace SmartMaintenance.Application.DTOs.Interventions
{
    public class InterventionDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime? PlannedDate { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? EstimatedDurationMinutes { get; set; }
        public int? ActualDurationMinutes { get; set; }
        public string? Report { get; set; }

        // Équipement lié
        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; } = string.Empty;
        public string EquipmentSerialNumber { get; set; } = string.Empty;

        // Technicien assigné
        public int? TechnicianId { get; set; }
        public int? TechnicianUserId { get; set; }
        public string? TechnicianName { get; set; }
        public string? TechnicianSpecialization { get; set; }

        // Créateur
        public int CreatedByUserId { get; set; }
        public string CreatedByUsername { get; set; } = string.Empty;

        // Compteurs
        public int HistoryCount { get; set; }
    }
}
