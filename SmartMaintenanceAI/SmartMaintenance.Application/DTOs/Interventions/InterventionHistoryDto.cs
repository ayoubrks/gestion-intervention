namespace SmartMaintenance.Application.DTOs.Interventions
{
    public class InterventionHistoryDto
    {
        public int Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
        public int ChangedByUserId { get; set; }
        public string ChangedByUsername { get; set; } = string.Empty;
    }
}
