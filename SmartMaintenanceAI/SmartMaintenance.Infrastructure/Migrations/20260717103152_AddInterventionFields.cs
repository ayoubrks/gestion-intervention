using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartMaintenance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInterventionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActualDurationMinutes",
                table: "Interventions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "Interventions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "Interventions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedDurationMinutes",
                table: "Interventions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Report",
                table: "Interventions",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Interventions_CreatedByUserId",
                table: "Interventions",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Interventions_Users_CreatedByUserId",
                table: "Interventions",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Interventions_Users_CreatedByUserId",
                table: "Interventions");

            migrationBuilder.DropIndex(
                name: "IX_Interventions_CreatedByUserId",
                table: "Interventions");

            migrationBuilder.DropColumn(
                name: "ActualDurationMinutes",
                table: "Interventions");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Interventions");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Interventions");

            migrationBuilder.DropColumn(
                name: "EstimatedDurationMinutes",
                table: "Interventions");

            migrationBuilder.DropColumn(
                name: "Report",
                table: "Interventions");
        }
    }
}
