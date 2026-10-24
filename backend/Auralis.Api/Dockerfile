
# Giai đoạn 1: Build Backend .NET 10
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY Auralis.Api.csproj ./
RUN dotnet restore Auralis.Api.csproj

COPY . ./
RUN dotnet publish Auralis.Api.csproj -c Release -o /app/publish
# Giai đoạn 2: Chạy ứng dụng
FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

COPY --from=build /app/publish ./

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Auralis.Api.dll"]

