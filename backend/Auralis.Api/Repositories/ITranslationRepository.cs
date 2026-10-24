using Auralis.Api.Models;
namespace Auralis.Api.Repositories;
public interface ITranslationRepository
{
    Task<AudioGuide?> FindStoredTranslationAsync(string text, string target, CancellationToken ct);
}
