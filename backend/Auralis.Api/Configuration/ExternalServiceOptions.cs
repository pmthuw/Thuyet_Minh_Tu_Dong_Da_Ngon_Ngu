namespace Auralis.Api.Configuration;
public class RoutingOptions
{
    public string BaseUrl { get; set; } = "https://routing.openstreetmap.de/routed-foot";
}
public class TranslationOptions
{
    public string Provider { get; set; } = "None";
    public string? ApiKey { get; set; }
    public string? BaseUrl { get; set; }
}
