namespace Auralis.Api.Exceptions;
public class TranslationUnavailableException(string message, Exception? inner = null) : Exception(message, inner);
