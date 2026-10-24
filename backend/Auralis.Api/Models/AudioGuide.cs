namespace Auralis.Api.Models;
public class AudioGuide
{
    public int AudioGuideID { get; set; }
    public int POIID { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? TextContent { get; set; }
    public string? AudioUrl { get; set; }
    // SQL cho phép NULL, dù có DEFAULT 0.
    public int? DurationSeconds { get; set; } = 0;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public PointOfInterest PointOfInterest { get; set; } = null!;
    public Language Language { get; set; } = null!;
}
