using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.PreventiveMaintenance
{
    public class CompleteMaintenanceTaskDto
    {
        [StringLength(1000, ErrorMessage = "Les remarques ne peuvent pas dépasser 1000 caractères")]
        public string? Remarks { get; set; }
    }
}
