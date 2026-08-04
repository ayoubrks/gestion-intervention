namespace SmartMaintenance.Domain.Entities
{
    public class EquipmentCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        public ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();
    }
}
