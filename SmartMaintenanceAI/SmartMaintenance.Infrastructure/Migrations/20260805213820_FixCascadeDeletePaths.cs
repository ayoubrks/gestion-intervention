using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartMaintenance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixCascadeDeletePaths : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InterventionHistories_Users_ChangedByUserId",
                table: "InterventionHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_Interventions_Technicians_TechnicianId",
                table: "Interventions");

            migrationBuilder.DropForeignKey(
                name: "FK_Interventions_Users_CreatedByUserId",
                table: "Interventions");

            migrationBuilder.AddForeignKey(
                name: "FK_InterventionHistories_Users_ChangedByUserId",
                table: "InterventionHistories",
                column: "ChangedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Interventions_Technicians_TechnicianId",
                table: "Interventions",
                column: "TechnicianId",
                principalTable: "Technicians",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Interventions_Users_CreatedByUserId",
                table: "Interventions",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InterventionHistories_Users_ChangedByUserId",
                table: "InterventionHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_Interventions_Technicians_TechnicianId",
                table: "Interventions");

            migrationBuilder.DropForeignKey(
                name: "FK_Interventions_Users_CreatedByUserId",
                table: "Interventions");

            migrationBuilder.AddForeignKey(
                name: "FK_InterventionHistories_Users_ChangedByUserId",
                table: "InterventionHistories",
                column: "ChangedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Interventions_Technicians_TechnicianId",
                table: "Interventions",
                column: "TechnicianId",
                principalTable: "Technicians",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Interventions_Users_CreatedByUserId",
                table: "Interventions",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
