namespace SmartMaintenance.Application.Interfaces
{
    public interface IStatisticsService
    {
        Task<object> GetDashboardStatsAsync();
        Task<string> GetAISynthesisAsync();
    }
}
