using System.ComponentModel.DataAnnotations;

namespace SmartMaintenance.Application.DTOs.Interventions
{
    public class CompleteInterventionDto
    {
        [Required(ErrorMessage = "Le rapport de fin d'intervention est obligatoire")]
        public string Report { get; set; } = string.Empty;

        [Required(ErrorMessage = "La durée réelle est obligatoire")]
        [Range(1, int.MaxValue, ErrorMessage = "La durée réelle doit être supérieure à 0")]
        public int ActualDurationMinutes { get; set; }
    }
}
