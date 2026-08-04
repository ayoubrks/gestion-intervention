using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.SpareParts;

namespace SmartMaintenance.Application.Interfaces
{
    public interface ISparePartService
    {
        // --- CRUD Pièces de Rechange ---
        Task<PagedResult<SparePartDto>> GetAllSparePartsAsync(
            int page, int pageSize, string? search, bool? lowStockOnly);
        Task<SparePartDto?> GetSparePartByIdAsync(int id);
        Task<SparePartDto> CreateSparePartAsync(CreateSparePartDto createDto);
        Task<SparePartDto> UpdateSparePartAsync(int id, UpdateSparePartDto updateDto);
        Task<bool> DeleteSparePartAsync(int id);

        // --- Opérations Stock et Interventions ---
        Task<SparePartDto> AdjustStockAsync(int id, int quantityAdjustment);
        Task<bool> ConsumeSparePartInInterventionAsync(int interventionId, ConsumeSparePartDto consumeDto);
        Task<List<InterventionSparePartDto>> GetSparePartsUsedInInterventionAsync(int interventionId);
    }
}
