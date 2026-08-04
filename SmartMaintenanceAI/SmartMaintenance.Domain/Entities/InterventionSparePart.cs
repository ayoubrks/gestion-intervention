namespace SmartMaintenance.Domain.Entities
{
    public class InterventionSparePart
    {
        public int InterventionId { get; set; }
        public Intervention Intervention { get; set; } = null!;
        
        public int SparePartId { get; set; }
        public SparePart SparePart { get; set; } = null!;
        
        public int QuantityUsed { get; set; }
    }
}
