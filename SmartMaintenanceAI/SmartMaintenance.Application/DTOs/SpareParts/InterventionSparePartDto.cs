namespace SmartMaintenance.Application.DTOs.SpareParts
{
    public class InterventionSparePartDto
    {
        public int SparePartId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public decimal UnitCost { get; set; }
        public int QuantityUsed { get; set; }
        public decimal TotalCost => UnitCost * QuantityUsed;
    }
}
