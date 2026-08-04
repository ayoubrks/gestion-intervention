using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.Interventions
{
    public class CreateInterventionDto
    {
        [Required(ErrorMessage = "Le titre est obligatoire")]
        [StringLength(200, ErrorMessage = "Le titre ne peut pas dépasser 200 caractères")]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "La description ne peut pas dépasser 1000 caractères")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "La priorité est obligatoire")]
        public string Priority { get; set; } = "Normal"; // "Low", "Normal", "High", "Critical"

        public DateTime? PlannedDate { get; set; }

        public int? EstimatedDurationMinutes { get; set; }

        [Required(ErrorMessage = "L'équipement est obligatoire")]
        public int EquipmentId { get; set; }

        public int? TechnicianId { get; set; } // Optionnel : assignation immédiate
    }
}
