using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.Equipments;
using SmartMaintenance.Application.Interfaces;
using SmartMaintenance.Domain.Entities;
using SmartMaintenance.Infrastructure.Data;

namespace SmartMaintenance.Infrastructure.Services
{
    public class EquipmentService : IEquipmentService
    {
        private readonly AppDbContext _context;

        public EquipmentService(AppDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // SECTION 1 : CRUD ÉQUIPEMENTS
        // ==========================================

        /// <summary>
        /// Récupère une liste paginée d'équipements avec recherche et filtres.
        /// </summary>
        public async Task<PagedResult<EquipmentDto>> GetAllEquipmentsAsync(
            int page, int pageSize, string? search, string? status, int? categoryId)
        {
            // Requête de base avec inclusion de la catégorie
            var query = _context.Equipments
                .Include(e => e.Category)
                .Include(e => e.Interventions)
                .AsQueryable();

            // Filtrage par recherche (nom, numéro de série, localisation)
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(e =>
                    e.Name.ToLower().Contains(search) ||
                    e.SerialNumber.ToLower().Contains(search) ||
                    e.Location.ToLower().Contains(search));
            }

            // Filtrage par statut
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(e => e.Status.ToLower() == status.ToLower());
            }

            // Filtrage par catégorie
            if (categoryId.HasValue)
            {
                query = query.Where(e => e.CategoryId == categoryId.Value);
            }

            var totalCount = await query.CountAsync();

            var equipments = await query
                .OrderByDescending(e => e.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EquipmentDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    SerialNumber = e.SerialNumber,
                    Description = e.Description,
                    Location = e.Location,
                    Status = e.Status,
                    InstallationDate = e.InstallationDate,
                    LastMaintenanceDate = e.LastMaintenanceDate,
                    CreatedAt = e.CreatedAt,
                    CategoryId = e.CategoryId,
                    CategoryName = e.Category.Name,
                    InterventionCount = e.Interventions.Count
                })
                .ToListAsync();

            return new PagedResult<EquipmentDto>
            {
                Items = equipments,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        /// <summary>
        /// Récupère un équipement par son ID avec ses détails complets.
        /// </summary>
        public async Task<EquipmentDto?> GetEquipmentByIdAsync(int id)
        {
            var equipment = await _context.Equipments
                .Include(e => e.Category)
                .Include(e => e.Interventions)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null) return null;

            return new EquipmentDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                SerialNumber = equipment.SerialNumber,
                Description = equipment.Description,
                Location = equipment.Location,
                Status = equipment.Status,
                InstallationDate = equipment.InstallationDate,
                LastMaintenanceDate = equipment.LastMaintenanceDate,
                CreatedAt = equipment.CreatedAt,
                CategoryId = equipment.CategoryId,
                CategoryName = equipment.Category.Name,
                InterventionCount = equipment.Interventions.Count
            };
        }

        /// <summary>
        /// Crée un nouvel équipement après validation.
        /// </summary>
        public async Task<EquipmentDto> CreateEquipmentAsync(CreateEquipmentDto createDto)
        {
            // Vérifier que la catégorie existe
            var category = await _context.EquipmentCategories.FindAsync(createDto.CategoryId);
            if (category == null)
                throw new Exception("La catégorie spécifiée n'existe pas");

            // Vérifier l'unicité du numéro de série
            var existingSerial = await _context.Equipments
                .AnyAsync(e => e.SerialNumber.ToLower() == createDto.SerialNumber.ToLower());
            if (existingSerial)
                throw new Exception("Ce numéro de série existe déjà");

            var equipment = new Equipment
            {
                Name = createDto.Name,
                SerialNumber = createDto.SerialNumber,
                Description = createDto.Description,
                Location = createDto.Location,
                InstallationDate = createDto.InstallationDate,
                CategoryId = createDto.CategoryId,
                Status = "Operational",
                CreatedAt = DateTime.UtcNow
            };

            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync();

            // Charger la catégorie pour le DTO de retour
            await _context.Entry(equipment).Reference(e => e.Category).LoadAsync();

            return new EquipmentDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                SerialNumber = equipment.SerialNumber,
                Description = equipment.Description,
                Location = equipment.Location,
                Status = equipment.Status,
                InstallationDate = equipment.InstallationDate,
                LastMaintenanceDate = equipment.LastMaintenanceDate,
                CreatedAt = equipment.CreatedAt,
                CategoryId = equipment.CategoryId,
                CategoryName = equipment.Category.Name,
                InterventionCount = 0
            };
        }

        /// <summary>
        /// Met à jour un équipement existant (mise à jour partielle).
        /// </summary>
        public async Task<EquipmentDto> UpdateEquipmentAsync(int id, UpdateEquipmentDto updateDto)
        {
            var equipment = await _context.Equipments
                .Include(e => e.Category)
                .Include(e => e.Interventions)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null)
                throw new Exception("Équipement non trouvé");

            // Mise à jour partielle : on ne modifie que les champs fournis
            if (!string.IsNullOrWhiteSpace(updateDto.Name))
                equipment.Name = updateDto.Name;

            if (!string.IsNullOrWhiteSpace(updateDto.SerialNumber))
            {
                // Vérifier l'unicité du nouveau numéro de série
                var exists = await _context.Equipments
                    .AnyAsync(e => e.SerialNumber.ToLower() == updateDto.SerialNumber.ToLower() && e.Id != id);
                if (exists)
                    throw new Exception("Ce numéro de série existe déjà");
                equipment.SerialNumber = updateDto.SerialNumber;
            }

            if (updateDto.Description != null)
                equipment.Description = updateDto.Description;

            if (updateDto.Location != null)
                equipment.Location = updateDto.Location;

            if (!string.IsNullOrWhiteSpace(updateDto.Status))
            {
                var validStatuses = new[] { "Operational", "UnderMaintenance", "Broken" };
                if (!validStatuses.Contains(updateDto.Status))
                    throw new Exception("Statut invalide. Valeurs acceptées : Operational, UnderMaintenance, Broken");
                equipment.Status = updateDto.Status;
            }

            if (updateDto.InstallationDate.HasValue)
                equipment.InstallationDate = updateDto.InstallationDate;

            if (updateDto.CategoryId.HasValue)
            {
                var categoryExists = await _context.EquipmentCategories.AnyAsync(c => c.Id == updateDto.CategoryId.Value);
                if (!categoryExists)
                    throw new Exception("La catégorie spécifiée n'existe pas");
                equipment.CategoryId = updateDto.CategoryId.Value;
            }

            await _context.SaveChangesAsync();

            // Recharger la catégorie si elle a changé
            await _context.Entry(equipment).Reference(e => e.Category).LoadAsync();

            return new EquipmentDto
            {
                Id = equipment.Id,
                Name = equipment.Name,
                SerialNumber = equipment.SerialNumber,
                Description = equipment.Description,
                Location = equipment.Location,
                Status = equipment.Status,
                InstallationDate = equipment.InstallationDate,
                LastMaintenanceDate = equipment.LastMaintenanceDate,
                CreatedAt = equipment.CreatedAt,
                CategoryId = equipment.CategoryId,
                CategoryName = equipment.Category.Name,
                InterventionCount = equipment.Interventions.Count
            };
        }

        /// <summary>
        /// Supprime un équipement par son ID.
        /// </summary>
        public async Task<bool> DeleteEquipmentAsync(int id)
        {
            var equipment = await _context.Equipments
                .Include(e => e.Interventions)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (equipment == null) return false;

            // Empêcher la suppression si des interventions sont liées
            if (equipment.Interventions.Any())
                throw new Exception("Impossible de supprimer cet équipement car il a des interventions associées");

            _context.Equipments.Remove(equipment);
            await _context.SaveChangesAsync();
            return true;
        }

        // ==========================================
        // SECTION 2 : CRUD CATÉGORIES
        // ==========================================

        /// <summary>
        /// Récupère toutes les catégories avec le nombre d'équipements.
        /// </summary>
        public async Task<List<EquipmentCategoryDto>> GetAllCategoriesAsync()
        {
            return await _context.EquipmentCategories
                .Include(c => c.Equipments)
                .OrderBy(c => c.Name)
                .Select(c => new EquipmentCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    EquipmentCount = c.Equipments.Count
                })
                .ToListAsync();
        }

        /// <summary>
        /// Récupère une catégorie par son ID.
        /// </summary>
        public async Task<EquipmentCategoryDto?> GetCategoryByIdAsync(int id)
        {
            var category = await _context.EquipmentCategories
                .Include(c => c.Equipments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return null;

            return new EquipmentCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                EquipmentCount = category.Equipments.Count
            };
        }

        /// <summary>
        /// Crée une nouvelle catégorie après validation d'unicité.
        /// </summary>
        public async Task<EquipmentCategoryDto> CreateCategoryAsync(CreateCategoryDto createDto)
        {
            // Vérifier l'unicité du nom
            var exists = await _context.EquipmentCategories
                .AnyAsync(c => c.Name.ToLower() == createDto.Name.ToLower());
            if (exists)
                throw new Exception("Une catégorie avec ce nom existe déjà");

            var category = new EquipmentCategory
            {
                Name = createDto.Name,
                Description = createDto.Description
            };

            _context.EquipmentCategories.Add(category);
            await _context.SaveChangesAsync();

            return new EquipmentCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                EquipmentCount = 0
            };
        }

        /// <summary>
        /// Met à jour une catégorie existante.
        /// </summary>
        public async Task<EquipmentCategoryDto> UpdateCategoryAsync(int id, CreateCategoryDto updateDto)
        {
            var category = await _context.EquipmentCategories
                .Include(c => c.Equipments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                throw new Exception("Catégorie non trouvée");

            // Vérifier l'unicité du nom (exclure la catégorie courante)
            var exists = await _context.EquipmentCategories
                .AnyAsync(c => c.Name.ToLower() == updateDto.Name.ToLower() && c.Id != id);
            if (exists)
                throw new Exception("Une catégorie avec ce nom existe déjà");

            category.Name = updateDto.Name;
            category.Description = updateDto.Description;

            await _context.SaveChangesAsync();

            return new EquipmentCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                EquipmentCount = category.Equipments.Count
            };
        }

        /// <summary>
        /// Supprime une catégorie si elle ne contient aucun équipement.
        /// </summary>
        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var category = await _context.EquipmentCategories
                .Include(c => c.Equipments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return false;

            if (category.Equipments.Any())
                throw new Exception("Impossible de supprimer cette catégorie car elle contient des équipements");

            _context.EquipmentCategories.Remove(category);
            await _context.SaveChangesAsync();
            return true;
        }

        // ==========================================
        // SECTION 3 : STATISTIQUES
        // ==========================================

        /// <summary>
        /// Retourne les statistiques globales des équipements.
        /// </summary>
        public async Task<object> GetEquipmentStatsAsync()
        {
            var totalEquipments = await _context.Equipments.CountAsync();
            var operational = await _context.Equipments.CountAsync(e => e.Status == "Operational");
            var underMaintenance = await _context.Equipments.CountAsync(e => e.Status == "UnderMaintenance");
            var broken = await _context.Equipments.CountAsync(e => e.Status == "Broken");
            var totalCategories = await _context.EquipmentCategories.CountAsync();

            // Équipements par catégorie
            var byCategory = await _context.EquipmentCategories
                .Include(c => c.Equipments)
                .Select(c => new
                {
                    Category = c.Name,
                    Count = c.Equipments.Count
                })
                .ToListAsync();

            return new
            {
                TotalEquipments = totalEquipments,
                Operational = operational,
                UnderMaintenance = underMaintenance,
                Broken = broken,
                TotalCategories = totalCategories,
                ByCategory = byCategory
            };
        }
    }
}
