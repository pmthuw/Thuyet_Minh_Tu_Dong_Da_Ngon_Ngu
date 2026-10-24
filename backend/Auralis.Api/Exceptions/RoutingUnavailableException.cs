namespace Auralis.Api.Exceptions;
public class RoutingUnavailableException(string message, Exception? inner = null) : Exception(message, inner);
