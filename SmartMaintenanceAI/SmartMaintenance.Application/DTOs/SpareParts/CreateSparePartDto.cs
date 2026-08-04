using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.SpareParts
{
    public class CreateSparePartDto
    {
        [Required(ErrorMessage = "Le nom est obligatoire")]
        [StringLength(100, ErrorMessage = "Le nom ne peut pas dépasser 100 caractères")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "La référence est obligatoire")]
        [StringLength(50, ErrorMessage = "La référence ne peut pas dépasser 50 caractères")]
        public string Reference { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "La description ne peut pas dépasser 500 caractères")]
        public string Description { get; set; } = string.Empty;

        [Range(0.01, double.MaxValue, ErrorMessage = "Le coût unitaire doit être supérieur à 0")]
        public decimal UnitCost { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "La quantité en stock ne peut pas être négative")]
        public int StockQuantity { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Le seuil minimum ne peut pas être négatif")]
        public int MinimumThreshold { get; set; }
    }
}
