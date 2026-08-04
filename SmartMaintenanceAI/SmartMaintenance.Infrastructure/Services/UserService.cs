using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.Users;
using SmartMaintenance.Application.Interfaces;
using SmartMaintenance.Infrastructure.Data;
using System.Security.Cryptography;
using System.Text;

namespace SmartMaintenance.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<UserDto>> GetAllUsersAsync(int page, int pageSize, string? search, string? role)
        {
            var query = _context.Users.Include(u => u.Role).AsQueryable();

            // Filtrage par recherche (username ou email)
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(u =>
                    u.Username.ToLower().Contains(search) ||
                    u.Email.ToLower().Contains(search));
            }

            // Filtrage par rôle
            if (!string.IsNullOrWhiteSpace(role))
            {
                query = query.Where(u => u.Role.Name.ToLower() == role.ToLower());
            }

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderBy(u => u.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    RoleName = u.Role.Name,
                    RoleId = u.RoleId
                })
                .ToListAsync();

            return new PagedResult<UserDto>
            {
                Items = users,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                RoleName = user.Role.Name,
                RoleId = user.RoleId
            };
        }

        public async Task<UserDto> UpdateUserAsync(int id, UpdateUserDto updateDto)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                throw new Exception("Utilisateur non trouvé");

            if (!string.IsNullOrWhiteSpace(updateDto.Username))
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username.ToLower() == updateDto.Username.ToLower() && u.Id != id);
                if (existingUser != null)
                    throw new Exception("Ce nom d'utilisateur est déjà pris");
                user.Username = updateDto.Username;
            }

            if (!string.IsNullOrWhiteSpace(updateDto.Email))
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == updateDto.Email.ToLower() && u.Id != id);
                if (existingUser != null)
                    throw new Exception("Cet email est déjà utilisé");
                user.Email = updateDto.Email;
            }

            if (!string.IsNullOrWhiteSpace(updateDto.Password))
            {
                using var sha256 = SHA256.Create();
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(updateDto.Password));
                user.PasswordHash = Convert.ToBase64String(hashedBytes);
            }

            if (updateDto.RoleId.HasValue)
            {
                var roleExists = await _context.Roles.AnyAsync(r => r.Id == updateDto.RoleId.Value);
                if (!roleExists) throw new Exception("Rôle invalide");
                
                var oldRoleId = user.RoleId;
                user.RoleId = updateDto.RoleId.Value;
                
                // Gérer le profil technicien lors du changement de rôle
                var newRole = await _context.Roles.FindAsync(updateDto.RoleId.Value);
                var oldRole = await _context.Roles.FindAsync(oldRoleId);
                
                if (newRole?.Name == "Technician" && oldRole?.Name != "Technician")
                {
                    // Ajout du profil technicien
                    var existsTech = await _context.Technicians.AnyAsync(t => t.UserId == user.Id);
                    if (!existsTech)
                    {
                        _context.Technicians.Add(new Domain.Entities.Technician
                        {
                            UserId = user.Id,
                            Specialization = "Général",
                            IsAvailable = true
                        });
                    }
                }
                else if (newRole?.Name != "Technician" && oldRole?.Name == "Technician")
                {
                    // Suppression du profil technicien
                    var techProfile = await _context.Technicians.FirstOrDefaultAsync(t => t.UserId == user.Id);
                    if (techProfile != null)
                    {
                        _context.Technicians.Remove(techProfile);
                    }
                }
            }

            await _context.SaveChangesAsync();

            // Recharger le rôle si changé
            await _context.Entry(user).Reference(u => u.Role).LoadAsync();

            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                RoleName = user.Role.Name,
                RoleId = user.RoleId
            };
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto createDto)
        {
            var existingUsername = await _context.Users.AnyAsync(u => u.Username.ToLower() == createDto.Username.ToLower());
            if (existingUsername)
                throw new Exception("Ce nom d'utilisateur est déjà pris");

            var existingEmail = await _context.Users.AnyAsync(u => u.Email.ToLower() == createDto.Email.ToLower());
            if (existingEmail)
                throw new Exception("Cet email est déjà utilisé");

            var role = await _context.Roles.FindAsync(createDto.RoleId);
            if (role == null)
                throw new Exception("Rôle invalide");

            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(createDto.Password));
            var passwordHash = Convert.ToBase64String(hashedBytes);

            var user = new Domain.Entities.User
            {
                Username = createDto.Username,
                Email = createDto.Email,
                PasswordHash = passwordHash,
                RoleId = createDto.RoleId
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Si le rôle est Technician, créer automatiquement le profil technicien
            if (role.Name == "Technician")
            {
                var existsTech = await _context.Technicians.AnyAsync(t => t.UserId == user.Id);
                if (!existsTech)
                {
                    _context.Technicians.Add(new Domain.Entities.Technician
                    {
                        UserId = user.Id,
                        Specialization = "Général",
                        IsAvailable = true
                    });
                    await _context.SaveChangesAsync();
                }
            }

            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                RoleName = role.Name,
                RoleId = user.RoleId
            };
        }

        public async Task<IEnumerable<RoleDto>> GetRolesAsync()
        {
            return await _context.Roles
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name
                })
                .ToListAsync();
        }
    }
}
