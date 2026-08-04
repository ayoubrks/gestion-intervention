using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.Equipments
{
    public class UpdateEquipmentDto
    {
        [StringLength(100, ErrorMessage = "Le nom ne peut pas dépasser 100 caractères")]
        public string? Name { get; set; }

        [StringLength(50, ErrorMessage = "Le numéro de série ne peut pas dépasser 50 caractères")]
        public string? SerialNumber { get; set; }

        [StringLength(500, ErrorMessage = "La description ne peut pas dépasser 500 caractères")]
        public string? Description { get; set; }

        [StringLength(200, ErrorMessage = "La localisation ne peut pas dépasser 200 caractères")]
        public string? Location { get; set; }

        public string? Status { get; set; } // "Operational", "UnderMaintenance", "Broken"

        public DateTime? InstallationDate { get; set; }

        public int? CategoryId { get; set; }
    }
}
