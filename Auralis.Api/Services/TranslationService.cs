using System.Net.Http.Json;
using System.Text.Json;
using Auralis.Api.Data;
using Auralis.Api.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Auralis.Api.Services;

public class TranslationOptions
{
    /// <summary>None | Google | LibreTranslate</summary>
    public string Provider { get; set; } = "None";
    public string? ApiKey { get; set; }

    /// <summary>Chỉ cần với LibreTranslate, ví dụ http://localhost:5001</summary>
    public string? BaseUrl { get; set; }
}

public class TranslationUnavailableException(string message, Exception? inner = null)
    : Exception(message, inner);

public interface ITranslationService
{
    Task<TranslateResponse> TranslateAsync(string text, string target, string? source, CancellationToken ct);
}

public class TranslationService(
    AppDbContext db, HttpClient http, IOptions<TranslationOptions> options, ILogger<TranslationService> log)
    : ITranslationService
{
    private readonly TranslationOptions _opt = options.Value;

    public async Task<TranslateResponse> TranslateAsync(string text, string target, string? source, CancellationToken ct)
    {
        text = text.Trim();

        // 1) Thuyết minh đã có sẵn trong DB → trả luôn, không tốn quota dịch vụ ngoài.
        var stored = await db.PoiTranslations.AsNoTracking()
            .Where(t => t.Text == text)
            .Select(t => t.PoiId)
            .FirstOrDefaultAsync(ct);
        if (stored != 0)
        {
            var hit = await db.PoiTranslations.AsNoTracking()
                .Where(t => t.PoiId == stored && t.Language == target)
                .Select(t => t.Text)
                .FirstOrDefaultAsync(ct);
            if (hit is not null) return new TranslateResponse(hit, target, "local");
        }

        // 2) Dịch vụ dịch ngoài (nếu đã cấu hình).
        try
        {
            return _opt.Provider switch
            {
                "Google" => await GoogleAsync(text, target, source, ct),
                "LibreTranslate" => await LibreAsync(text, target, source, ct),
                _ => throw new TranslationUnavailableException(
                    "Chưa cấu hình dịch vụ dịch (Translation:Provider) và nội dung này chưa có bản dịch sẵn."),
            };
        }
        catch (Exception ex) when (!ct.IsCancellationRequested &&
            ex is HttpRequestException or TaskCanceledException or JsonException or KeyNotFoundException)
        {
            log.LogWarning(ex, "Dịch vụ dịch {Provider} lỗi.", _opt.Provider);
            throw new TranslationUnavailableException("Dịch vụ dịch tạm thời không khả dụng.", ex);
        }
    }

    private async Task<TranslateResponse> GoogleAsync(string text, string target, string? source, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_opt.ApiKey))
            throw new TranslationUnavailableException("Thiếu Translation:ApiKey cho Google.");

        var body = new Dictionary<string, string>
        {
            ["q"] = text,
            ["target"] = target == "zh" ? "zh-CN" : target,
            ["format"] = "text",
        };
        if (!string.IsNullOrEmpty(source)) body["source"] = source == "zh" ? "zh-CN" : source;

        using var req = new HttpRequestMessage(HttpMethod.Post,
            "https://translation.googleapis.com/language/translate/v2")
        { Content = JsonContent.Create(body) };
        req.Headers.Add("X-goog-api-key", _opt.ApiKey); // header thay vì ?key= để key không lọt vào log URL

        using var res = await http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
        var translated = doc.RootElement.GetProperty("data").GetProperty("translations")[0]
            .GetProperty("translatedText").GetString() ?? string.Empty;
        return new TranslateResponse(translated, target, "google");
    }

    private async Task<TranslateResponse> LibreAsync(string text, string target, string? source, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_opt.BaseUrl))
            throw new TranslationUnavailableException("Thiếu Translation:BaseUrl cho LibreTranslate.");

        var body = new Dictionary<string, string>
        {
            ["q"] = text,
            ["source"] = string.IsNullOrEmpty(source) ? "auto" : source,
            ["target"] = target,
            ["format"] = "text",
        };
        if (!string.IsNullOrWhiteSpace(_opt.ApiKey)) body["api_key"] = _opt.ApiKey;

        using var res = await http.PostAsJsonAsync($"{_opt.BaseUrl.TrimEnd('/')}/translate", body, ct);
        res.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
        var translated = doc.RootElement.GetProperty("translatedText").GetString() ?? string.Empty;
        return new TranslateResponse(translated, target, "libretranslate");
    }
}
