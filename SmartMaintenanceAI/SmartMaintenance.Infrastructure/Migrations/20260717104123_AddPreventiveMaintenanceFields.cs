using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartMaintenance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPreventiveMaintenanceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "PreventiveMaintenances",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "PreventiveMaintenances",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "InterventionId",
                table: "MaintenanceTasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Remarks",
                table: "MaintenanceTasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledDate",
                table: "MaintenanceTasks",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceTasks_InterventionId",
                table: "MaintenanceTasks",
                column: "InterventionId");

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceTasks_Interventions_InterventionId",
                table: "MaintenanceTasks",
                column: "InterventionId",
                principalTable: "Interventions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceTasks_Interventions_InterventionId",
                table: "MaintenanceTasks");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceTasks_InterventionId",
                table: "MaintenanceTasks");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "PreventiveMaintenances");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "PreventiveMaintenances");

            migrationBuilder.DropColumn(
                name: "InterventionId",
                table: "MaintenanceTasks");

            migrationBuilder.DropColumn(
                name: "Remarks",
                table: "MaintenanceTasks");

            migrationBuilder.DropColumn(
                name: "ScheduledDate",
                table: "MaintenanceTasks");
        }
    }
}
