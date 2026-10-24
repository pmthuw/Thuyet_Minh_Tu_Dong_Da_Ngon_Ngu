using Auralis.Api.Models;
namespace Auralis.Api.Repositories;
public interface ITranslationProviderRepository
{
    Task<ExternalTranslation> TranslateAsync(string text, string target, string? source, CancellationToken ct);
}
