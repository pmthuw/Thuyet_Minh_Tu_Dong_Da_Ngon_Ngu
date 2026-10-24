using Auralis.Api.Dtos;
namespace Auralis.Api.Services;
public interface ITranslationService
{
    Task<TranslateResponse> TranslateAsync(TranslateRequest request, CancellationToken ct);
}
