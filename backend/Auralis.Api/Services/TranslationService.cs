using Auralis.Api.Dtos;
using Auralis.Api.Repositories;
namespace Auralis.Api.Services;
public class TranslationService(ITranslationRepository repository, ITranslationProviderRepository provider)
    : ITranslationService
{
    public async Task<TranslateResponse> TranslateAsync(TranslateRequest request, CancellationToken ct)
    {
        var text = request.Text;
        if (string.IsNullOrWhiteSpace(text) || text.Length > 5000)
            throw new BusinessValidationException("Nội dung dịch phải có từ 1 đến 5000 ký tự.");
        if (string.IsNullOrWhiteSpace(request.TargetLanguage))
            throw new BusinessValidationException("Cần nhập targetLanguage.");
        var target = Languages.NormalizeCode(request.TargetLanguage);
        var source = request.SourceLanguage is null ? null : Languages.NormalizeCode(request.SourceLanguage);
        if (!Languages.IsSupported(target))
            throw new BusinessValidationException("targetLanguage không được hỗ trợ",
                $"Giá trị hợp lệ: {string.Join(", ", Languages.Supported)}.");
        if (!string.IsNullOrEmpty(source) && !Languages.IsSupported(source))
            throw new BusinessValidationException("sourceLanguage không được hỗ trợ",
                $"Giá trị hợp lệ: {string.Join(", ", Languages.Supported)}.");
        text = text.Trim();
        var guide = await repository.FindStoredTranslationAsync(text, target, ct);
        if (guide?.TextContent is not null)
            return new TranslateResponse(guide.TextContent, target, "local");
        var result = await provider.TranslateAsync(text, Languages.ProviderCode(target),
            string.IsNullOrEmpty(source) ? null : Languages.ProviderCode(source), ct);
        return new TranslateResponse(result.TranslatedText, target, result.Provider);
    }
}
