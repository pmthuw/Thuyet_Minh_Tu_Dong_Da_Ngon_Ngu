namespace Auralis.Api.Services;
// Lỗi nghiệp vụ độc lập với HTTP; tầng API quyết định mã trạng thái.
public class BusinessValidationException(string message, string? detail = null) : Exception(message)
{
    public string? Detail { get; } = detail;
}
