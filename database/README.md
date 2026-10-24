# SQL Server AuralisDB

1_Create.sql: schema SQL Server mà backend đang sử dụng. Chỉ chạy trên database mới.
2_Mock.sql: dữ liệu mẫu do bạn cung cấp, tùy chọn; chỉ chạy một lần sau 1_Create.sql.

Không chạy schema.sql bản SQLite cũ; bản này đã được chuyển vào backend/Auralis.Api/Legacy/schema.sqlite.sql.
Backend đọc SQL Server qua ConnectionStrings:Default; không đọc pois.seed.json.
Không có dữ liệu thật hoặc bản sao lưu database trong ZIP này, chỉ có các script tạo schema và mock.
