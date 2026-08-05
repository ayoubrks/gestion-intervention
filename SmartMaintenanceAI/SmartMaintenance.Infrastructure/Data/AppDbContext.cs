using Microsoft.EntityFrameworkCore;
using SmartMaintenance.Domain.Entities;

namespace SmartMaintenance.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Technician> Technicians { get; set; }
        public DbSet<EquipmentCategory> EquipmentCategories { get; set; }
        public DbSet<Equipment> Equipments { get; set; }
        public DbSet<Intervention> Interventions { get; set; }
        public DbSet<InterventionHistory> InterventionHistories { get; set; }
        public DbSet<SparePart> SpareParts { get; set; }
        public DbSet<InterventionSparePart> InterventionSpareParts { get; set; }
        public DbSet<PreventiveMaintenance> PreventiveMaintenances { get; set; }
        public DbSet<MaintenanceTask> MaintenanceTasks { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Composite key for InterventionSparePart many-to-many join table
            modelBuilder.Entity<InterventionSparePart>()
                .HasKey(isp => new { isp.InterventionId, isp.SparePartId });
                
            modelBuilder.Entity<InterventionSparePart>()
                .HasOne(isp => isp.Intervention)
                .WithMany(i => i.SparePartsUsed)
                .HasForeignKey(isp => isp.InterventionId);
                
            modelBuilder.Entity<InterventionSparePart>()
                .HasOne(isp => isp.SparePart)
                .WithMany(sp => sp.Interventions)
                .HasForeignKey(isp => isp.SparePartId);

            // One-to-One User <-> Technician
            modelBuilder.Entity<User>()
                .HasOne(u => u.TechnicianProfile)
                .WithOne(t => t.User)
                .HasForeignKey<Technician>(t => t.UserId);

            // Prevent multiple cascade paths for Intervention & InterventionHistory
            modelBuilder.Entity<Intervention>()
                .HasOne(i => i.CreatedByUser)
                .WithMany()
                .HasForeignKey(i => i.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<InterventionHistory>()
                .HasOne(h => h.ChangedByUser)
                .WithMany()
                .HasForeignKey(h => h.ChangedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Intervention>()
                .HasOne(i => i.Technician)
                .WithMany(t => t.Interventions)
                .HasForeignKey(i => i.TechnicianId)
                .OnDelete(DeleteBehavior.SetNull);

            // Seed Data : Les 3 rôles de base
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Admin" },
                new Role { Id = 2, Name = "Manager" },
                new Role { Id = 3, Name = "Technician" }
            );
        }
    }
}
