using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
namespace Auralis.Api.Admin;
public class AdminExceptionFilter:IExceptionFilter {
 public void OnException(ExceptionContext c){if(c.Exception is not AdminProblem e)return;c.Result=new ObjectResult(new ProblemDetails{Status=e.Status,Title=e.Message}){StatusCode=e.Status};c.ExceptionHandled=true;}
}
