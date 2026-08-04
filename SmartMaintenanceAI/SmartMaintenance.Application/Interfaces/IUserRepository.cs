using SmartMaintenance.Domain.Entities;

namespace SmartMaintenance.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetUserByUsernameAsync(string username);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User> AddUserAsync(User user);
        Task<Role?> GetRoleByIdAsync(int roleId);
        Task<bool> RoleExistsAsync(int roleId);
        Task AddTechnicianProfileAsync(int userId);
        Task RemoveTechnicianProfileAsync(int userId);
        Task<bool> HasTechnicianProfileAsync(int userId);
    }
}
