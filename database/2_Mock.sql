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
('staff_thu', '$2a$11$e8O8a3cK8S0GvH.A9F/z3.mX8qQx/v5m9N1x7Z2x3v4b5n6m7L8k9', N'Pham Hoang Anh Thu', 2);
go

-- Dia diem du lich tai HCM
insert into PointsOfInterest (Name, Description, Address, Latitude, Longitude, ImageUrl, Status)
values 
(N'Nha tho Duc Ba', N'Cong trinh kien truc Phap dac dao tai trung tam Sai Gon', N'01 Cong xa Paris, Ben Nghe, Quan 1, TP.HCM', 10.779785, 106.699018, 'https://example.com/images/nhathoducba.jpg', 'Active'),
(N'Buu dien Trung tam Sai Gon', N'Diem tham quan lich su mang kien truc Gothic va Renaissance', N'02 Cong xa Paris, Ben Nghe, Quan 1, TP.HCM', 10.779838, 106.699882, 'https://example.com/images/buudiensg.jpg', 'Active'),
(N'Dinh Thong Nhat', N'Di tich lich su quoc gia dac biet, noi luu giu nhieu dau an chien tranh', N'135 Nam Ky Khoi Nghia, Ben Thanh, Quan 1, TP.HCM', 10.776930, 106.695305, 'https://example.com/images/dinhthongnhat.jpg', 'Active'),
(N'Cho Ben Thanh', N'Bieu tuong giao thuong va van hoa lau doi cua thanh pho', N'Duong Le Loi, Phuong Ben Thanh, Quan 1, TP.HCM', 10.772517, 106.698004, 'https://example.com/images/chobenthanh.jpg', 'Active'),
(N'Bao tang Lich su Viet Nam', N'Noi trung bay va luu giu hang ngan hien vat co gia tri', N'02 Nguyen Binh Khiem, Ben Nghe, Quan 1, TP.HCM', 10.787750, 106.704230, 'https://example.com/images/baotanglichsu.jpg', 'Active'),
(N'Nha hat Thanh pho', N'Cong trinh kien truc co kinh chuyen bieu dien nghe thuat', N'07 Cong truong Lam Son, Ben Nghe, Quan 1, TP.HCM', 10.776735, 106.701314, 'https://example.com/images/nhahatphothu.jpg', 'Active');
go

-- Thuyet minh dia diem
insert into AudioGuides (POIID, LanguageCode, Title, TextContent, AudioUrl, DurationSeconds)
values 
-- nha tho duc ba
(1, 'vi-VN', N'Gioi thieu Nha tho Duc Ba', N'Chao mung ban den voi Nha tho Duc Ba Sai Gon. Day la mot trong nhung kien truc tieu bieu...', 'https://example.com/audio/vi_nhathoducba.mp3', 120),
(1, 'en-US', N'Notre-Dame Cathedral Overview', N'Welcome to Notre-Dame Cathedral Saigon. Built between 1877 and 1880...', 'https://example.com/audio/en_nhathoducba.mp3', 115),

-- buu dien sai gon
(2, 'vi-VN', N'Lich su Buu dien Sai Gon', N'Buu dien Trung tam Sai Gon duoc xay dung tu nam 1886 den 1891...', 'https://example.com/audio/vi_buudien.mp3', 135),
(2, 'en-US', N'Saigon Central Post Office History', N'The Saigon Central Post Office was designed and built in the late 19th century...', 'https://example.com/audio/en_buudien.mp3', 130),

-- dinh thong nhat
(3, 'vi-VN', N'Kham pha Dinh Thong Nhat', N'Dinh Thong Nhat hay Dinh Doc Lap la noi chung kien nhieu su kien lich su trong dai...', 'https://example.com/audio/vi_dinhthongnhat.mp3', 150),
(3, 'en-US', N'Reunification Palace Exploration', N'The Reunification Palace, formerly known as Independence Palace...', 'https://example.com/audio/en_dinhthongnhat.mp3', 145),

-- cho ben thanh
(4, 'vi-VN', N'Net dep Cho Ben Thanh', N'Cho Ben Thanh khong chi la noi mua sam ma con la nhip song dac trung...', 'https://example.com/audio/vi_chobenthanh.mp3', 110),
(4, 'en-US', N'Ben Thanh Market Experience', N'Ben Thanh Market is one of the oldest and most iconic symbols...', 'https://example.com/audio/en_chobenthanh.mp3', 105),

-- bao tang lich su
(5, 'vi-VN', N'Bao tang Lich su Viet Nam', N'Bao tang luu giu nhieu bo suu tap hien vat quy gia tu thoi hung vuong...', 'https://example.com/audio/vi_baotanglichsu.mp3', 125),

-- nha hat thanh pho
(6, 'vi-VN', N'Nha hat Thanh pho', N'Nha hat TP.HCM mang phong cach kien truc Tay Do dac trung...', 'https://example.com/audio/vi_nhahat.mp3', 100);
go

