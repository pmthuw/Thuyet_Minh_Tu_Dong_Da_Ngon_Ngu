namespace Auralis.Api.Models;

/// <summary>Địa điểm tham quan (Point Of Interest).</summary>
public class Poi
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>heritage | arch | shop | food (khớp CATS ở frontend).</summary>
    public string Category { get; set; } = string.Empty;

    public double Lat { get; set; }
    public double Lng { get; set; }
    public double Rating { get; set; }

    public List<PoiTranslation> Translations { get; set; } = new();
}

/// <summary>Nội dung thuyết minh của một địa điểm theo từng ngôn ngữ (vi, en, zh, ko, ja, fr).</summary>
public class PoiTranslation
{
    public int Id { get; set; }
    public int PoiId { get; set; }
    public string Language { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;

    public Poi? Poi { get; set; }
}
