using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.SpareParts
{
    public class ConsumeSparePartDto
    {
        [Required(ErrorMessage = "L'ID de la pièce est obligatoire")]
        public int SparePartId { get; set; }

        [Required(ErrorMessage = "La quantité est obligatoire")]
        [Range(1, int.MaxValue, ErrorMessage = "La quantité doit être supérieure à 0")]
        public int Quantity { get; set; }
    }
}
