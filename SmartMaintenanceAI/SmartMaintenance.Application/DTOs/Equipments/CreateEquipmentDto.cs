using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.Equipments
{
    public class CreateEquipmentDto
    {
        [Required(ErrorMessage = "Le nom est obligatoire")]
        [StringLength(100, ErrorMessage = "Le nom ne peut pas dépasser 100 caractères")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le numéro de série est obligatoire")]
        [StringLength(50, ErrorMessage = "Le numéro de série ne peut pas dépasser 50 caractères")]
        public string SerialNumber { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "La description ne peut pas dépasser 500 caractères")]
        public string Description { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "La localisation ne peut pas dépasser 200 caractères")]
        public string Location { get; set; } = string.Empty;

        public DateTime? InstallationDate { get; set; }

        [Required(ErrorMessage = "La catégorie est obligatoire")]
        public int CategoryId { get; set; }
    }
}
