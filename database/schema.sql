-- AURALIS – lược đồ CSDL (tham khảo; backend tự tạo bằng EF Core EnsureCreated với SQLite)
CREATE TABLE Pois (
  Id       INTEGER PRIMARY KEY AUTOINCREMENT,
  Name     TEXT NOT NULL,
  Category TEXT NOT NULL,           -- heritage | arch | shop | food
  Lat      REAL NOT NULL,
  Lng      REAL NOT NULL,
  Rating   REAL NOT NULL
);
CREATE INDEX IX_Pois_Category ON Pois (Category);

CREATE TABLE PoiTranslations (
  Id       INTEGER PRIMARY KEY AUTOINCREMENT,
  PoiId    INTEGER NOT NULL REFERENCES Pois(Id) ON DELETE CASCADE,
  Language TEXT NOT NULL,           -- vi | en | zh | ko
  Text     TEXT NOT NULL
);
CREATE UNIQUE INDEX IX_PoiTranslations_PoiId_Language ON PoiTranslations (PoiId, Language);

-- Dữ liệu mẫu
INSERT INTO Pois (Id, Name, Category, Lat, Lng, Rating) VALUES (1, 'Dinh Độc Lập', 'heritage', 10.777, 106.6954, 4.8);
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (1, 'vi', 'Công trình lịch sử gắn với ngày 30/4/1975, nay là bảo tàng. Bạn có thể đi qua phòng họp nội các, hầm chỉ huy và sân thượng nơi trực thăng từng đáp.');
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (1, 'en', 'A landmark tied to 30 April 1975, now a museum. Walk through the cabinet room, the command bunker and the rooftop helipad.');
INSERT INTO Pois (Id, Name, Category, Lat, Lng, Rating) VALUES (2, 'Nhà thờ Đức Bà', 'arch', 10.7798, 106.699, 4.7);
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (2, 'vi', 'Nhà thờ gạch đỏ xây cuối thế kỷ 19 với hai tháp chuông cao 58 mét, vật liệu được chở từ Pháp sang.');
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (2, 'en', 'A red-brick cathedral from the late 19th century with twin 58-metre bell towers. Its bricks were shipped from France.');
INSERT INTO Pois (Id, Name, Category, Lat, Lng, Rating) VALUES (3, 'Bưu điện Trung tâm', 'arch', 10.78, 106.7, 4.6);
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (3, 'vi', 'Bưu điện kiến trúc Pháp với mái vòm sắt và bản đồ cổ trên tường. Vẫn đang hoạt động, bạn có thể gửi bưu thiếp tại quầy.');
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (3, 'en', 'A French-era post office with an iron-vaulted hall and old maps on the walls. Still working: send a postcard from the counter.');
INSERT INTO Pois (Id, Name, Category, Lat, Lng, Rating) VALUES (4, 'Chợ Bến Thành', 'shop', 10.7725, 106.698, 4.5);
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (4, 'vi', 'Khu chợ biểu tượng từ năm 1914. Ban ngày bán đồ lưu niệm và đặc sản, buổi tối là chợ đêm với nhiều quán ăn.');
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (4, 'en', 'The city’s iconic market since 1914. Souvenirs and local specialties by day, a night market with food stalls after dark.');
INSERT INTO Pois (Id, Name, Category, Lat, Lng, Rating) VALUES (5, 'Bảo tàng Chứng tích Chiến tranh', 'heritage', 10.7794, 106.6922, 4.7);
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (5, 'vi', 'Bảo tàng trưng bày hình ảnh và hiện vật về chiến tranh Việt Nam. Nên dành ít nhất một giờ để tham quan.');
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (5, 'en', 'A museum of photographs and artefacts from the Vietnam War. Allow at least an hour for the visit.');
INSERT INTO Pois (Id, Name, Category, Lat, Lng, Rating) VALUES (6, 'Cà phê chung cư 42 Nguyễn Huệ', 'food', 10.7745, 106.704, 4.4);
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (6, 'vi', 'Tòa chung cư cũ nay là dãy quán cà phê trên từng tầng. Lên tầng cao để nhìn xuống phố đi bộ Nguyễn Huệ.');
INSERT INTO PoiTranslations (PoiId, Language, Text) VALUES (6, 'en', 'An old apartment block turned into stacked cafés. Head up for a view over Nguyen Hue walking street.');
