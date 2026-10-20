using Auralis.Api.Dtos;
using Auralis.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Auralis.Api.Controllers;

[ApiController]
[Route("api/translate")]
public class TranslateController(ITranslationService translation) : ControllerBase
{
    /// <summary>POST /api/translate  { text, targetLanguage: vi|en|zh|ko|ja|fr, sourceLanguage? }</summary>
    [HttpPost]
    public async Task<ActionResult<TranslateResponse>> Post([FromBody] TranslateRequest req, CancellationToken ct)
    {
        var target = req.TargetLanguage!.Trim().ToLowerInvariant();
        var source = req.SourceLanguage?.Trim().ToLowerInvariant();

        if (!Languages.Supported.Contains(target))
            return Problem(statusCode: 400, title: "targetLanguage không được hỗ trợ",
                detail: $"Giá trị hợp lệ: {string.Join(", ", Languages.Supported)}.");
        if (!string.IsNullOrEmpty(source) && !Languages.Supported.Contains(source))
            return Problem(statusCode: 400, title: "sourceLanguage không được hỗ trợ",
                detail: $"Giá trị hợp lệ: {string.Join(", ", Languages.Supported)}.");

        try
        {
            return await translation.TranslateAsync(req.Text!, target, source, ct);
        }
        catch (TranslationUnavailableException ex)
        {
            return Problem(statusCode: 503, title: "Không thể dịch lúc này", detail: ex.Message);
        }
    }
}
