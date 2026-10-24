# AURALIS Backend — SQL Server

Backend đã dùng Microsoft.EntityFrameworkCore.SqlServer và UseSqlServer; schema là AuralisDB từ database/1_Create.sql. Đọc ../README_SQLSERVER.md để cấu hình instance, tạo database và chạy kiểm tra.

Controller → Service → Repository → AppDbContext → SQL Server.

Từ thư mục giải nén: cd backend/Auralis.Api, dotnet restore, dotnet build, dotnet run.

Đã kiểm tra tĩnh schema; chưa chạy build/SQL trong môi trường sửa mã. Frontend cần điều chỉnh lọc danh mục/đánh giá do SQL Server schema không có Category/Rating.
