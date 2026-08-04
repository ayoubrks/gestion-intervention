using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.Interventions
{
    public class UpdateInterventionDto
    {
        [StringLength(200, ErrorMessage = "Le titre ne peut pas dépasser 200 caractères")]
        public string? Title { get; set; }

        [StringLength(1000, ErrorMessage = "La description ne peut pas dépasser 1000 caractères")]
        public string? Description { get; set; }

        public string? Priority { get; set; } // "Low", "Normal", "High", "Critical"

        public DateTime? PlannedDate { get; set; }

        public int? EstimatedDurationMinutes { get; set; }

        public int? EquipmentId { get; set; }
    }
}
