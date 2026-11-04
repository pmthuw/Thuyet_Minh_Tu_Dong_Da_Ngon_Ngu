# AURALIS — Database

- `1_Create.sql`: SQL Server, tạo database `AuralisDB` và các bảng.
- `2_Mock.sql`: SQL Server, thêm dữ liệu mẫu.
- `schema.sql`: SQLite schema mẫu của Backend hiện tại, **khác cấu trúc** với hai script SQL Server.

Trong SQL Server Management Studio, chạy `1_Create.sql` trước, rồi chạy `2_Mock.sql`.

**Quan trọng:** Backend `backend/Auralis.Api` hiện sử dụng SQLite (`auralis.db`), **chưa** kết nối đến SQL Server. Đây là thao tác tách và ghép file, không phải chuyển đổi database.
