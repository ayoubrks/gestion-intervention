namespace SmartMaintenance.Domain.Entities
{
    public class Technician
    {
        public int Id { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public bool IsAvailable { get; set; } = true;
        
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        
        public ICollection<Intervention> Interventions { get; set; } = new List<Intervention>();
    }
}
