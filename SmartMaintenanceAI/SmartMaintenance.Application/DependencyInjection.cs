using Microsoft.Extensions.DependencyInjection;

namespace SmartMaintenance.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // Ici, on ajoutera CQRS (MediatR), AutoMapper, ou les services métiers
            // ex: services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
            
            return services;
        }
    }
}
