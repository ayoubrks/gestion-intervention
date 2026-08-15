using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SmartMaintenance.Application.DTOs.Auth;
using SmartMaintenance.Application.Interfaces;
using SmartMaintenance.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SmartMaintenance.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetUserByUsernameAsync(loginDto.Username)
                       ?? await _userRepository.GetUserByEmailAsync(loginDto.Username);
            
            if (user == null || !VerifyPasswordHash(loginDto.Password, user.PasswordHash))
            {
                throw new Exception("Identifiants invalides");
            }

            var token = CreateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Username = user.Username,
                Role = user.Role.Name,
                Message = "Connexion réussie"
            };
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            if (await _userRepository.GetUserByUsernameAsync(registerDto.Username) != null)
                throw new Exception("Ce nom d'utilisateur est déjà pris");

            if (await _userRepository.GetUserByEmailAsync(registerDto.Email) != null)
                throw new Exception("Cet email est déjà utilisé");
                
            if (!await _userRepository.RoleExistsAsync(registerDto.RoleId))
                throw new Exception("Rôle invalide");

            var user = new User
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                PasswordHash = CreatePasswordHash(registerDto.Password),
                RoleId = registerDto.RoleId
            };

            await _userRepository.AddUserAsync(user);

            // Si le rôle est Technician, créer automatiquement le profil technicien
            var role = await _userRepository.GetRoleByIdAsync(registerDto.RoleId);
            if (role != null && role.Name == "Technician")
            {
                await _userRepository.AddTechnicianProfileAsync(user.Id);
            }

            // Fetch again to get the role included
            var createdUser = await _userRepository.GetUserByUsernameAsync(user.Username);

            var token = CreateToken(createdUser!);

            return new AuthResponseDto
            {
                Token = token,
                UserId = createdUser!.Id,
                Username = createdUser!.Username,
                Role = createdUser.Role.Name,
                Message = "Inscription réussie"
            };
        }

        private string CreatePasswordHash(string password)
        {
            // For production, use BCrypt.Net. Here we use a basic hash for demo.
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPasswordHash(string password, string storedHash)
        {
            return CreatePasswordHash(password) == storedHash;
        }

        private string CreateToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.Name)
            };

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(double.Parse(jwtSettings["ExpiryInMinutes"]!)),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
