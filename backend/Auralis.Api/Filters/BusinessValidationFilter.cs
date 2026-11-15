using Auralis.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
namespace Auralis.Api.Filters;
public class BusinessValidationFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not BusinessValidationException error) return;
        context.Result = new BadRequestObjectResult(new ProblemDetails
        {
            Status = 400, Title = error.Message, Detail = error.Detail
        });
        context.ExceptionHandled = true;
    }
}
