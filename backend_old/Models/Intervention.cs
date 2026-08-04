using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class Intervention
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        // "Pending", "InProgress", "Completed"
        [Required]
        public string Status { get; set; } = "Pending";

        public string? TechnicianName { get; set; }

        public string? PhotoUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
