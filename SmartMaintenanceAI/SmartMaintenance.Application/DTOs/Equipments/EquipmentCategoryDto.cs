namespace SmartMaintenance.Application.DTOs.Equipments
{
    public class EquipmentCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int EquipmentCount { get; set; }
    }
}
