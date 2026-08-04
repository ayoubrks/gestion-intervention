using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.SpareParts;
using SmartMaintenance.Application.Interfaces;
using SmartMaintenance.Domain.Entities;
using SmartMaintenance.Infrastructure.Data;

namespace SmartMaintenance.Infrastructure.Services
{
    public class SparePartService : ISparePartService
    {
        private readonly AppDbContext _context;

        public SparePartService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<SparePartDto>> GetAllSparePartsAsync(
            int page, int pageSize, string? search, bool? lowStockOnly)
        {
            var query = _context.SpareParts.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(sp => sp.Name.ToLower().Contains(search) || sp.Reference.ToLower().Contains(search));
            }

            if (lowStockOnly.HasValue && lowStockOnly.Value)
            {
                query = query.Where(sp => sp.StockQuantity <= sp.MinimumThreshold);
            }

            var totalCount = await query.CountAsync();

            var spareParts = await query
                .OrderBy(sp => sp.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(sp => new SparePartDto
                {
                    Id = sp.Id,
                    Name = sp.Name,
                    Reference = sp.Reference,
                    Description = sp.Description,
                    UnitCost = sp.UnitCost,
                    StockQuantity = sp.StockQuantity,
                    MinimumThreshold = sp.MinimumThreshold,
                    CreatedAt = sp.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<SparePartDto>
            {
                Items = spareParts,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<SparePartDto?> GetSparePartByIdAsync(int id)
        {
            var sp = await _context.SpareParts.FindAsync(id);
            if (sp == null) return null;

            return new SparePartDto
            {
                Id = sp.Id,
                Name = sp.Name,
                Reference = sp.Reference,
                Description = sp.Description,
                UnitCost = sp.UnitCost,
                StockQuantity = sp.StockQuantity,
                MinimumThreshold = sp.MinimumThreshold,
                CreatedAt = sp.CreatedAt
            };
        }

        public async Task<SparePartDto> CreateSparePartAsync(CreateSparePartDto createDto)
        {
            var exists = await _context.SpareParts.AnyAsync(sp => sp.Reference.ToLower() == createDto.Reference.ToLower());
            if (exists) throw new Exception("Cette référence de pièce existe déjà.");

            var sparePart = new SparePart
            {
                Name = createDto.Name,
                Reference = createDto.Reference,
                Description = createDto.Description,
                UnitCost = createDto.UnitCost,
                StockQuantity = createDto.StockQuantity,
                MinimumThreshold = createDto.MinimumThreshold,
                CreatedAt = DateTime.UtcNow
            };

            _context.SpareParts.Add(sparePart);
            await _context.SaveChangesAsync();

            return await GetSparePartByIdAsync(sparePart.Id) ?? throw new Exception("Erreur création");
        }

        public async Task<SparePartDto> UpdateSparePartAsync(int id, UpdateSparePartDto updateDto)
        {
            var sp = await _context.SpareParts.FindAsync(id);
            if (sp == null) throw new Exception("Pièce non trouvée");

            if (!string.IsNullOrWhiteSpace(updateDto.Name))
                sp.Name = updateDto.Name;

            if (!string.IsNullOrWhiteSpace(updateDto.Reference))
            {
                var exists = await _context.SpareParts.AnyAsync(s => s.Reference.ToLower() == updateDto.Reference.ToLower() && s.Id != id);
                if (exists) throw new Exception("Cette référence de pièce existe déjà.");
                sp.Reference = updateDto.Reference;
            }

            if (updateDto.Description != null)
                sp.Description = updateDto.Description;

            if (updateDto.UnitCost.HasValue)
                sp.UnitCost = updateDto.UnitCost.Value;

            if (updateDto.StockQuantity.HasValue)
                sp.StockQuantity = updateDto.StockQuantity.Value;

            if (updateDto.MinimumThreshold.HasValue)
                sp.MinimumThreshold = updateDto.MinimumThreshold.Value;

            await _context.SaveChangesAsync();

            return await GetSparePartByIdAsync(sp.Id) ?? throw new Exception("Erreur");
        }

        public async Task<bool> DeleteSparePartAsync(int id)
        {
            var sp = await _context.SpareParts
                .Include(s => s.Interventions)
                .FirstOrDefaultAsync(s => s.Id == id);
            
            if (sp == null) return false;

            if (sp.Interventions.Any())
                throw new Exception("Impossible de supprimer une pièce utilisée dans des interventions.");

            _context.SpareParts.Remove(sp);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SparePartDto> AdjustStockAsync(int id, int quantityAdjustment)
        {
            var sp = await _context.SpareParts.FindAsync(id);
            if (sp == null) throw new Exception("Pièce non trouvée");

            if (sp.StockQuantity + quantityAdjustment < 0)
                throw new Exception("Stock insuffisant pour cet ajustement.");

            sp.StockQuantity += quantityAdjustment;
            await _context.SaveChangesAsync();

            return await GetSparePartByIdAsync(sp.Id) ?? throw new Exception("Erreur");
        }

        public async Task<bool> ConsumeSparePartInInterventionAsync(int interventionId, ConsumeSparePartDto consumeDto)
        {
            var intervention = await _context.Interventions.FindAsync(interventionId);
            if (intervention == null) throw new Exception("Intervention non trouvée");

            if (intervention.Status == "Completed" || intervention.Status == "Cancelled")
                throw new Exception("Impossible d'ajouter des pièces à une intervention terminée ou annulée.");

            var sp = await _context.SpareParts.FindAsync(consumeDto.SparePartId);
            if (sp == null) throw new Exception("Pièce non trouvée");

            if (sp.StockQuantity < consumeDto.Quantity)
                throw new Exception($"Stock insuffisant pour {sp.Name}. Stock actuel: {sp.StockQuantity}");

            // Deduct stock
            sp.StockQuantity -= consumeDto.Quantity;

            // Check if already used in this intervention
            var existingUsed = await _context.InterventionSpareParts
                .FirstOrDefaultAsync(isp => isp.InterventionId == interventionId && isp.SparePartId == consumeDto.SparePartId);

            if (existingUsed != null)
            {
                existingUsed.QuantityUsed += consumeDto.Quantity;
            }
            else
            {
                _context.InterventionSpareParts.Add(new InterventionSparePart
                {
                    InterventionId = interventionId,
                    SparePartId = consumeDto.SparePartId,
                    QuantityUsed = consumeDto.Quantity
                });
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<InterventionSparePartDto>> GetSparePartsUsedInInterventionAsync(int interventionId)
        {
            return await _context.InterventionSpareParts
                .Include(isp => isp.SparePart)
                .Where(isp => isp.InterventionId == interventionId)
                .Select(isp => new InterventionSparePartDto
                {
                    SparePartId = isp.SparePart.Id,
                    Name = isp.SparePart.Name,
                    Reference = isp.SparePart.Reference,
                    UnitCost = isp.SparePart.UnitCost,
                    QuantityUsed = isp.QuantityUsed
                })
                .ToListAsync();
        }
    }
}
