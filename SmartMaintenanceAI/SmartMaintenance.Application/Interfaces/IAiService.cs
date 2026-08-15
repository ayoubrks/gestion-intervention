namespace SmartMaintenance.Application.Interfaces
{
    public interface IAiService
    {
        Task<string> GetChatbotResponseAsync(string userMessage);
    }
}
