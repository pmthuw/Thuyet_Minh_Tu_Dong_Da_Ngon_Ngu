using Auralis.Api.Data;
using Auralis.Api.Models;
using Microsoft.EntityFrameworkCore;
namespace Auralis.Api.Repositories;
public class TranslationRepository(AppDbContext db) : ITranslationRepository
{
    public async Task<AudioGuide?> FindStoredTranslationAsync(string text, string target, CancellationToken ct)
    {
        var readable = db.AudioGuides.AsNoTracking().Where(g => !g.IsDeleted
            && g.Language.IsActive && !g.PointOfInterest.IsDeleted
            && g.PointOfInterest.Status == "Active");
        // Mã đầy đủ (en-US) hoặc mã ngắn (en) đều tìm được bản dịch lưu sẵn.
        var matches = from source in readable
                      join translated in readable on source.POIID equals translated.POIID
                      where source.TextContent == text && translated.TextContent != null
                        && (translated.LanguageCode == target || translated.LanguageCode.StartsWith(target + "-"))
                      orderby (translated.LanguageCode == target ? 0 : 1),
                        translated.Language.IsDefault descending, translated.LanguageCode, source.AudioGuideID
                      select translated;
        return await matches.FirstOrDefaultAsync(ct);
    }
}
