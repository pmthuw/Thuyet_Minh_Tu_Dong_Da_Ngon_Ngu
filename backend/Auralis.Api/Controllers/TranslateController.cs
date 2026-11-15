using Auralis.Api.Dtos;
using Auralis.Api.Exceptions;
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
        try
        {
            return await translation.TranslateAsync(req, ct);
        }
        catch (TranslationUnavailableException ex)
        {
            return Problem(statusCode: 503, title: "Không thể dịch lúc này", detail: ex.Message);
        }
    }
}
