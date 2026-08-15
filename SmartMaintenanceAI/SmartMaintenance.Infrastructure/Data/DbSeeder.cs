using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Domain.Entities;
using System.Security.Cryptography;
using System.Text;

namespace SmartMaintenance.Infrastructure.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            // Ensure Database Created
            await context.Database.EnsureCreatedAsync();

            // 1. SEED ROLES
            if (!await context.Roles.AnyAsync())
            {
                context.Roles.AddRange(
                    new Role { Id = 1, Name = "Admin" },
                    new Role { Id = 3, Name = "Technician" }
                );
                await context.SaveChangesAsync();
            }

            // 2. SEED CATEGORIES (Indépendant)
            if (!await context.EquipmentCategories.AnyAsync())
            {
                context.EquipmentCategories.AddRange(
                    new EquipmentCategory { Name = "Hydraulique", Description = "Systèmes de pompes et fluides" },
                    new EquipmentCategory { Name = "Électrique", Description = "Armoires, générateurs et câblages" },
                    new EquipmentCategory { Name = "Mécanique", Description = "Compresseurs, moteurs et engrenages" },
                    new EquipmentCategory { Name = "Pneumatique", Description = "Vérins et régulateurs d'air" },
                    new EquipmentCategory { Name = "Général", Description = "Équipements divers et outillage" }
                );
                await context.SaveChangesAsync();
            }

            // 3. SEED USERS (3 utilisateurs principaux + 1 technicien sup)
            if (!await context.Users.AnyAsync())
            {
                string HashPassword(string pwd)
                {
                    using var sha256 = SHA256.Create();
                    var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(pwd));
                    return Convert.ToBase64String(bytes);
                }

                var admin = new User
                {
                    Username = "admin",
                    Email = "admin@smartmaintenance.com",
                    PasswordHash = HashPassword("Admin123!"),
                    RoleId = 1
                };

                var tech1 = new User
                {
                    Username = "technicien1",
                    Email = "tech1@smartmaintenance.com",
                    PasswordHash = HashPassword("Tech123!"),
                    RoleId = 3
                };

                var tech2 = new User
                {
                    Username = "technicien2",
                    Email = "tech2@smartmaintenance.com",
                    PasswordHash = HashPassword("Tech123!"),
                    RoleId = 3
                };

                context.Users.AddRange(admin, tech1, tech2);
                await context.SaveChangesAsync();

                // Profile techniciens
                context.Technicians.AddRange(
                    new Technician { UserId = tech1.Id, Specialization = "Hydraulique & Mécanique", IsAvailable = true },
                    new Technician { UserId = tech2.Id, Specialization = "Électrique & Automatisme", IsAvailable = true }
                );
                await context.SaveChangesAsync();
            }

            // 4. SEED EQUIPMENTS
            if (!await context.Equipments.AnyAsync())
            {
                var catHyd = await context.EquipmentCategories.FirstOrDefaultAsync(c => c.Name == "Hydraulique");
                var catEle = await context.EquipmentCategories.FirstOrDefaultAsync(c => c.Name == "Électrique");
                var catMec = await context.EquipmentCategories.FirstOrDefaultAsync(c => c.Name == "Mécanique");

                int hydId = catHyd?.Id ?? 1;
                int eleId = catEle?.Id ?? 2;
                int mecId = catMec?.Id ?? 3;

                var eq1 = new Equipment
                {
                    Name = "Pompe Hydraulique P-200",
                    SerialNumber = "SN-HYD-001",
                    Description = "Pompe principale circuit hydraulique atelier A",
                    Location = "Atelier A - Zone 1",
                    Status = "Active",
                    CategoryId = hydId,
                    InstallationDate = DateTime.UtcNow.AddYears(-2),
                    LastMaintenanceDate = DateTime.UtcNow.AddDays(-15)
                };

                var eq2 = new Equipment
                {
                    Name = "Générateur Électrique G-500",
                    SerialNumber = "SN-ELE-002",
                    Description = "Générateur de secours 500kVA",
                    Location = "Local Technique - Bâtiment B",
                    Status = "Maintenance",
                    CategoryId = eleId,
                    InstallationDate = DateTime.UtcNow.AddYears(-3),
                    LastMaintenanceDate = DateTime.UtcNow.AddDays(-5)
                };

                var eq3 = new Equipment
                {
                    Name = "Compresseur d'Air C-100",
                    SerialNumber = "SN-MEC-003",
                    Description = "Compresseur à vis haute pression",
                    Location = "Zone Pneumatique",
                    Status = "Active",
                    CategoryId = mecId,
                    InstallationDate = DateTime.UtcNow.AddYears(-1),
                    LastMaintenanceDate = DateTime.UtcNow.AddDays(-30)
                };

                context.Equipments.AddRange(eq1, eq2, eq3);
                await context.SaveChangesAsync();
            }

            // 5. SEED PIÈCES DE RECHANGE (3 lignes de pièces)
            if (!await context.SpareParts.AnyAsync())
            {
                var part1 = new SparePart
                {
                    Name = "Filtre à Huile Haute Pression",
                    Reference = "REF-FHP-101",
                    Description = "Filtre de remplacement pour pompes hydrauliques",
                    UnitCost = 45.50m,
                    StockQuantity = 15,
                    MinimumThreshold = 5
                };

                var part2 = new SparePart
                {
                    Name = "Joint d'Étanchéité Piston 50mm",
                    Reference = "REF-JNT-202",
                    Description = "Joint torique résistant aux hautes températures",
                    UnitCost = 12.00m,
                    StockQuantity = 2, // Stock bas !
                    MinimumThreshold = 10
                };

                var part3 = new SparePart
                {
                    Name = "Courroie de Transmission K-34",
                    Reference = "REF-CRR-303",
                    Description = "Courroie crantée renforcée kevlar",
                    UnitCost = 28.90m,
                    StockQuantity = 25,
                    MinimumThreshold = 8
                };

                context.SpareParts.AddRange(part1, part2, part3);
                await context.SaveChangesAsync();
            }

            // 6. SEED INTERVENTIONS
            if (!await context.Interventions.AnyAsync())
            {
                var adminUser = await context.Users.FirstAsync(u => u.RoleId == 1);
                var tech1Profile = await context.Technicians.FirstAsync();
                var eqList = await context.Equipments.ToListAsync();

                if (eqList.Count > 0)
                {
                    var inv1 = new Intervention
                    {
                        Title = "Surchauffe Moteur Pompe P-200",
                        Description = "Constat d'une élévation anormale de température du carter.",
                        Status = "Pending",
                        Priority = "High",
                        EquipmentId = eqList[0].Id,
                        CreatedByUserId = adminUser.Id,
                        CreatedAt = DateTime.UtcNow.AddHours(-10)
                    };

                    var inv2 = new Intervention
                    {
                        Title = "Remplacement Courroie Compresseur C-100",
                        Description = "Usure prononcée détectée lors de l'inspection visuelle.",
                        Status = "InProgress",
                        Priority = "Normal",
                        EquipmentId = eqList.Count > 2 ? eqList[2].Id : eqList[0].Id,
                        TechnicianId = tech1Profile.Id,
                        CreatedByUserId = adminUser.Id,
                        PlannedDate = DateTime.UtcNow.AddHours(-2),
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    };

                    var inv3 = new Intervention
                    {
                        Title = "Inspection Électrique Générateur G-500",
                        Description = "Contrôle périodique des balais et alternateur.",
                        Status = "Completed",
                        Priority = "Normal",
                        EquipmentId = eqList.Count > 1 ? eqList[1].Id : eqList[0].Id,
                        TechnicianId = tech1Profile.Id,
                        CreatedByUserId = adminUser.Id,
                        PlannedDate = DateTime.UtcNow.AddDays(-3),
                        CompletedAt = DateTime.UtcNow.AddDays(-2),
                        ActualDurationMinutes = 90,
                        Report = "Vérification effectuée. Nettoyage des contacts et test sous charge réussi.",
                        CreatedAt = DateTime.UtcNow.AddDays(-4)
                    };

                    context.Interventions.AddRange(inv1, inv2, inv3);
                    await context.SaveChangesAsync();
                }
            }

            // 7. SEED PREVENTIVE MAINTENANCE
            if (!await context.PreventiveMaintenances.AnyAsync())
            {
                var eqList = await context.Equipments.ToListAsync();

                if (eqList.Count > 0)
                {
                    var plan1 = new PreventiveMaintenance
                    {
                        Title = "Graissage Mensuel Pompe P-200",
                        Description = "Vérification des paliers et ajout de graisse synthétique.",
                        FrequencyDays = 30,
                        NextDueDate = DateTime.UtcNow.AddDays(15),
                        EquipmentId = eqList[0].Id
                    };

                    var plan2 = new PreventiveMaintenance
                    {
                        Title = "Contrôle Trimestriel Générateur G-500",
                        Description = "Test de démarrage à vide et contrôle du niveau de fioul.",
                        FrequencyDays = 90,
                        NextDueDate = DateTime.UtcNow.AddDays(45),
                        EquipmentId = eqList.Count > 1 ? eqList[1].Id : eqList[0].Id
                    };

                    var plan3 = new PreventiveMaintenance
                    {
                        Title = "Vidange Annuelle Compresseur C-100",
                        Description = "Remplacement de l'huile de compresseur et filtres.",
                        FrequencyDays = 365,
                        NextDueDate = DateTime.UtcNow.AddDays(120),
                        EquipmentId = eqList.Count > 2 ? eqList[2].Id : eqList[0].Id
                    };

                    context.PreventiveMaintenances.AddRange(plan1, plan2, plan3);
                    await context.SaveChangesAsync();

                    // Tâches préventives générées
                    context.MaintenanceTasks.AddRange(
                        new MaintenanceTask
                        {
                            PreventiveMaintenanceId = plan1.Id,
                            ScheduledDate = DateTime.UtcNow.AddDays(15),
                            Status = "Pending"
                        },
                        new MaintenanceTask
                        {
                            PreventiveMaintenanceId = plan2.Id,
                            ScheduledDate = DateTime.UtcNow.AddDays(45),
                            Status = "Pending"
                        },
                        new MaintenanceTask
                        {
                            PreventiveMaintenanceId = plan3.Id,
                            ScheduledDate = DateTime.UtcNow.AddDays(-5),
                            Status = "Completed",
                            ExecutedAt = DateTime.UtcNow.AddDays(-5),
                            Remarks = "Vidange effectuée sans anomalie."
                        }
                    );
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
