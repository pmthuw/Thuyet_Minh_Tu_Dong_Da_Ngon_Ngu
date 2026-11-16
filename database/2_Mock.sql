use AuralisDB;
go

-- Thêm ngôn ngữ 
insert into Languages (LanguageCode, LanguageName, IsDefault, IsActive)
values 
    ('vi-VN', N'Tiếng Việt', 1, 1),
    ('en-US', N'English', 0, 1);
go

-- Tai khoan Admin (Pass mac dinh: Admin@123)
insert into Users (Username, PasswordHash, FullName, IsActive) values 
('admin', '$2a$11$e8O8a3cK8S0GvH.A9F/z3.mX8qQx/v5m9N1x7Z2x3v4b5n6m7L8k9', N'Quản trị viên', 1),
('staff_thu', '$2a$11$e8O8a3cK8S0GvH.A9F/z3.mX8qQx/v5m9N1x7Z2x3v4b5n6m7L8k9', N'Phạm Hoàng Anh Thư', 2);
go

-- Dia diem du lich tai HCM
insert into PointsOfInterest (Name, Description, Address, Latitude, Longitude, ImageUrl, Status)
values 
(N'Nhà thờ Đức Bà', N'Công trình kiến trúc Pháp độc đáo tại trung tâm Sài Gòn', N'01 Công xã Paris, Bến Nghé, Quận 1, TP.HCM', 10.779785, 106.699018, 'https://example.com/images/nhathoducba.jpg', 'Active'),
(N'Bưu điện Trung tâm Sài Gòn', N'Điểm tham quan lịch sử mang kiến trúc Gothic và Renaissance', N'02 Công xã Paris, Bến Nghé, Quận 1, TP.HCM', 10.779838, 106.699882, 'https://example.com/images/buudiensg.jpg', 'Active'),
(N'Dinh Thống Nhất', N'Di tích lịch sử quốc gia đặc biệt, nơi lưu giữ nhiều dấu ấn chiến tranh', N'135 Nam Kỳ Khởi Nghĩa, Bến Thành, Quận 1, TP.HCM', 10.776930, 106.695305, 'https://example.com/images/dinhthongnhat.jpg', 'Active'),
(N'Chợ Bến Thành', N'Biểu tượng giao thương và văn hóa lâu đời của thành phố', N'Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM', 10.772517, 106.698004, 'https://example.com/images/chobenthanh.jpg', 'Active'),
(N'Bảo tàng Lịch sử Việt Nam', N'Nơi trưng bày và lưu giữ hàng ngàn hiện vật có giá trị', N'02 Nguyễn Bỉnh Khiêm, Bến Nghé, Quận 1, TP.HCM', 10.787750, 106.704230, 'https://example.com/images/baotanglichsu.jpg', 'Active'),
(N'Nhà hát Thành phố', N'Công trình kiến trúc cổ điển chuyên biểu diễn nghệ thuật', N'07 Công trường Lam Sơn, Bến Nghé, Quận 1, TP.HCM', 10.776735, 106.701314, 'https://example.com/images/nhahatphothu.jpg', 'Active');
go

-- Thuyet minh dia diem
insert into AudioGuides (POIID, LanguageCode, Title, TextContent, AudioUrl, DurationSeconds)
values 
-- nha tho duc ba
(1, 'vi-VN', N'Giới thiệu Nhà thờ Đức Bà', N'Chào mừng bạn đến với Nhà thờ Đức Bà Sài Gòn. Đây là một trong những kiến trúc tiêu biểu...', 'https://example.com/audio/vi_nhathoducba.mp3', 120),
(1, 'en-US', N'Notre-Dame Cathedral Overview', N'Welcome to Notre-Dame Cathedral Saigon. Built between 1877 and 1880...', 'https://example.com/audio/en_nhathoducba.mp3', 115),

-- buu dien sai gon
(2, 'vi-VN', N'Lịch sử Bưu điện Sài Gòn', N'Bưu điện Trung tâm Sài Gòn được xây dựng từ năm 1886 đến 1891...', 'https://example.com/audio/vi_buudien.mp3', 135),
(2, 'en-US', N'Saigon Central Post Office History', N'The Saigon Central Post Office was designed and built in the late 19th century...', 'https://example.com/audio/en_buudien.mp3', 130),

-- dinh thong nhat
(3, 'vi-VN', N'Khám phá Dinh Thống Nhất', N'Dinh Thống Nhất hay Dinh Độc Lập là nơi chứng kiến nhiều sự kiện lịch sử trong đại...', 'https://example.com/audio/vi_dinhthongnhat.mp3', 150),
(3, 'en-US', N'Reunification Palace Exploration', N'The Reunification Palace, formerly known as Independence Palace...', 'https://example.com/audio/en_dinhthongnhat.mp3', 145),

-- cho ben thanh
(4, 'vi-VN', N'Nét đẹp Chợ Bến Thành', N'Chợ Bến Thành không chỉ là nơi mua sắm mà còn là nhịp sống đặc trưng...', 'https://example.com/audio/vi_chobenthanh.mp3', 110),
(4, 'en-US', N'Ben Thanh Market Experience', N'Ben Thanh Market is one of the oldest and most iconic symbols...', 'https://example.com/audio/en_chobenthanh.mp3', 105),

-- bao tang lich su
(5, 'vi-VN', N'Bảo tàng Lịch sử Việt Nam', N'Bảo tàng lưu giữ nhiều bộ sưu tập hiện vật quý giá từ thời Hùng Vương...', 'https://example.com/audio/vi_baotanglichsu.mp3', 125),

-- nha hat thanh pho
(6, 'vi-VN', N'Nhà hát Thành phố', N'Nhà hát TP.HCM mang phong cách kiến trúc Tây Âu đặc trưng...', 'https://example.com/audio/vi_nhahat.mp3', 100);
go

-- Them thuyet minh tieng Anh cho Bao tang va Nha hat
insert AudioGuides (POIID, LanguageCode, Title, TextContent)
values
(5, 'en-US', N'Vietnam National Museum of History', N'The museum preserves thousands of valuable artifacts from the Hung Kings era to modern times.'),
(6, 'en-US', N'Saigon Opera House', N'The Saigon Opera House is a classic Western-style building, still used for performances today.');
go