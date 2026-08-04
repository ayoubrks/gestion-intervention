using SmartMaintenance.Application.DTOs.Common;
using SmartMaintenance.Application.DTOs.Users;

namespace SmartMaintenance.Application.Interfaces
{
    public interface IUserService
    {
        Task<PagedResult<UserDto>> GetAllUsersAsync(int page, int pageSize, string? search, string? role);
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<UserDto> CreateUserAsync(CreateUserDto createDto);
        Task<UserDto> UpdateUserAsync(int id, UpdateUserDto updateDto);
        Task<bool> DeleteUserAsync(int id);
        Task<IEnumerable<RoleDto>> GetRolesAsync();
    }
}
