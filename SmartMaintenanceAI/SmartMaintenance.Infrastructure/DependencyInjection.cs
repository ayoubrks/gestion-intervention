using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartMaintenance.Infrastructure.Data;

namespace SmartMaintenance.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

            // Injection des Repositories
            services.AddScoped<SmartMaintenance.Application.Interfaces.IUserRepository, SmartMaintenance.Infrastructure.Repositories.UserRepository>();
            
            // Injection des Services (Logique)
            services.AddScoped<SmartMaintenance.Application.Interfaces.IAuthService, SmartMaintenance.Infrastructure.Services.AuthService>();
            services.AddScoped<SmartMaintenance.Application.Interfaces.IUserService, SmartMaintenance.Infrastructure.Services.UserService>();
            services.AddScoped<SmartMaintenance.Application.Interfaces.IEquipmentService, SmartMaintenance.Infrastructure.Services.EquipmentService>();
            services.AddScoped<SmartMaintenance.Application.Interfaces.IInterventionService, SmartMaintenance.Infrastructure.Services.InterventionService>();
            services.AddScoped<SmartMaintenance.Application.Interfaces.ISparePartService, SmartMaintenance.Infrastructure.Services.SparePartService>();
            services.AddScoped<SmartMaintenance.Application.Interfaces.IPreventiveMaintenanceService, SmartMaintenance.Infrastructure.Services.PreventiveMaintenanceService>();
            services.AddScoped<SmartMaintenance.Application.Interfaces.IStatisticsService, SmartMaintenance.Infrastructure.Services.StatisticsService>();
            
            // IA Service
            services.AddHttpClient<SmartMaintenance.Application.Interfaces.IAiService, SmartMaintenance.Infrastructure.Services.AiService>();

            return services;
        }
    }
}
