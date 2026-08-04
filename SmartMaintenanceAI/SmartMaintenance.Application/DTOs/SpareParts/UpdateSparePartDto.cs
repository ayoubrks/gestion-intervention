using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.SpareParts
{
    public class UpdateSparePartDto
    {
        [StringLength(100, ErrorMessage = "Le nom ne peut pas dépasser 100 caractères")]
        public string? Name { get; set; }

        [StringLength(50, ErrorMessage = "La référence ne peut pas dépasser 50 caractères")]
        public string? Reference { get; set; }

        [StringLength(500, ErrorMessage = "La description ne peut pas dépasser 500 caractères")]
        public string? Description { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Le coût unitaire doit être supérieur à 0")]
        public decimal? UnitCost { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "La quantité en stock ne peut pas être négative")]
        public int? StockQuantity { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Le seuil minimum ne peut pas être négatif")]
        public int? MinimumThreshold { get; set; }
    }
}
