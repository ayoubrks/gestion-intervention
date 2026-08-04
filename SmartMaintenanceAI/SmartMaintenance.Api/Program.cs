using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SmartMaintenance.Application;
using SmartMaintenance.Infrastructure;
using SmartMaintenance.Infrastructure.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CONFIGURATION DE L'ARCHITECTURE (DEPENDENCY INJECTION) ---
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// --- 2. CONFIGURATION DE L'AUTHENTIFICATION JWT ---
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(secretKey)
    };
});

// Ajout des contrôleurs API
builder.Services.AddControllers();

// Configuration Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS pour React
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// --- AUTOMATIC SEEDING ON STARTUP ---
using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await DbSeeder.SeedAsync(dbContext);
        
        // Créer les profils techniciens manquants pour les utilisateurs existants avec le rôle Technician
        var technicianRoleId = dbContext.Roles.FirstOrDefault(r => r.Name == "Technician")?.Id;
        if (technicianRoleId.HasValue)
        {
            var techUsersWithoutProfile = dbContext.Users
                .Where(u => u.RoleId == technicianRoleId.Value && u.TechnicianProfile == null)
                .ToList();
            
            foreach (var techUser in techUsersWithoutProfile)
            {
                dbContext.Technicians.Add(new SmartMaintenance.Domain.Entities.Technician
                {
                    UserId = techUser.Id,
                    Specialization = "Général",
                    IsAvailable = true
                });
            }
            
            if (techUsersWithoutProfile.Any())
            {
                await dbContext.SaveChangesAsync();
                Console.WriteLine($"[Startup] {techUsersWithoutProfile.Count} profil(s) technicien(s) manquant(s) créé(s).");
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Erreur lors du seeding: " + ex.Message);
    }
}

// --- 3. CONFIGURATION DU PIPELINE HTTP ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
