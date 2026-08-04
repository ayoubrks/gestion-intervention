using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Application.Interfaces;
using SmartMaintenance.Domain.Entities;
using SmartMaintenance.Infrastructure.Data;

namespace SmartMaintenance.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        }

        public async Task<User> AddUserAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<Role?> GetRoleByIdAsync(int roleId)
        {
            return await _context.Roles.FindAsync(roleId);
        }

        public async Task<bool> RoleExistsAsync(int roleId)
        {
            return await _context.Roles.AnyAsync(r => r.Id == roleId);
        }

        public async Task AddTechnicianProfileAsync(int userId)
        {
            var exists = await _context.Technicians.AnyAsync(t => t.UserId == userId);
            if (!exists)
            {
                _context.Technicians.Add(new Technician
                {
                    UserId = userId,
                    Specialization = "Général",
                    IsAvailable = true
                });
                await _context.SaveChangesAsync();
            }
        }

        public async Task RemoveTechnicianProfileAsync(int userId)
        {
            var technician = await _context.Technicians.FirstOrDefaultAsync(t => t.UserId == userId);
            if (technician != null)
            {
                _context.Technicians.Remove(technician);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> HasTechnicianProfileAsync(int userId)
        {
            return await _context.Technicians.AnyAsync(t => t.UserId == userId);
        }
    }
}
