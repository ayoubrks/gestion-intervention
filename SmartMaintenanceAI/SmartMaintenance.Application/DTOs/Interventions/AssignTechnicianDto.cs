using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.Interventions
{
    public class AssignTechnicianDto
    {
        [Required(ErrorMessage = "L'ID du technicien est obligatoire")]
        public int TechnicianId { get; set; }
    }
}
