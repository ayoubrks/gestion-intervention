using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.Equipments;

namespace SmartMaintenance.Application.Interfaces
{
    public interface IEquipmentService
    {
        // --- CRUD Équipements ---
        Task<PagedResult<EquipmentDto>> GetAllEquipmentsAsync(
            int page, int pageSize, string? search, string? status, int? categoryId);
        Task<EquipmentDto?> GetEquipmentByIdAsync(int id);
        Task<EquipmentDto> CreateEquipmentAsync(CreateEquipmentDto createDto);
        Task<EquipmentDto> UpdateEquipmentAsync(int id, UpdateEquipmentDto updateDto);
        Task<bool> DeleteEquipmentAsync(int id);

        // --- CRUD Catégories ---
        Task<List<EquipmentCategoryDto>> GetAllCategoriesAsync();
        Task<EquipmentCategoryDto?> GetCategoryByIdAsync(int id);
        Task<EquipmentCategoryDto> CreateCategoryAsync(CreateCategoryDto createDto);
        Task<EquipmentCategoryDto> UpdateCategoryAsync(int id, CreateCategoryDto updateDto);
        Task<bool> DeleteCategoryAsync(int id);

        // --- Statistiques ---
        Task<object> GetEquipmentStatsAsync();
    }
}
