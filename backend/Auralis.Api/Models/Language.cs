namespace Auralis.Api.Models;
public class Language
{
    public string LanguageCode { get; set; } = string.Empty;
    public string LanguageName { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public List<AudioGuide> AudioGuides { get; set; } = [];
}
