using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.PreventiveMaintenance
{
    public class CreatePreventiveMaintenanceDto
    {
        [Required(ErrorMessage = "Le titre est obligatoire")]
        [StringLength(200, ErrorMessage = "Le titre ne peut pas dépasser 200 caractères")]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "La description ne peut pas dépasser 1000 caractères")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "La fréquence est obligatoire")]
        [Range(1, 3650, ErrorMessage = "La fréquence doit être comprise entre 1 et 3650 jours")]
        public int FrequencyDays { get; set; }

        [Required(ErrorMessage = "La prochaine date d'échéance est obligatoire")]
        public DateTime NextDueDate { get; set; }

        [Required(ErrorMessage = "L'équipement est obligatoire")]
        public int EquipmentId { get; set; }
    }
}
