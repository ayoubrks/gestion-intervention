namespace SmartMaintenance.Application.DTOs.SpareParts
{
    public class SparePartDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal UnitCost { get; set; }
        public int StockQuantity { get; set; }
        public int MinimumThreshold { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsLowStock => StockQuantity <= MinimumThreshold;
    }
}
