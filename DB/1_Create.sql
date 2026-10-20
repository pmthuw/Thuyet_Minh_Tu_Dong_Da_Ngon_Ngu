create database AuralisDB;
go

use AuralisDB;
go

-- Tạo bảng Users
create table Users (
    UserID int identity(1,1) primary key,
    Username varchar(50) not null unique,
    PasswordHash varchar(255) not null,
    FullName nvarchar(100) null,
    IsActive bit not null default 1,
    CreatedAt datetime not null default getdate()
);
go

-- Tạo bảng địa điểm du lịch POI
create table PointsOfInterest (
    POIID int identity(1,1) primary key,
    Name nvarchar(200) not null,
    Description nvarchar(max) null,
    Address nvarchar(500) null,
    Latitude decimal(9,6) not null,
    Longitude decimal(9,6) not null,
    ImageUrl varchar(500) null,
    Status nvarchar(20) not null default 'Active',
    IsDeleted bit not null default 0,
    CreatedAt datetime not null default getdate(),
    UpdatedAt datetime null
);
go

-- Tạo bảng ngôn ngữ
create table Languages (
    LanguageCode varchar(10) primary key,
    LanguageName nvarchar(50) not null,
    IsDefault bit not null default 0,
    IsActive bit not null default 1
);
go

-- Tạo bảng thuyết minh tự động
create table AudioGuides (
    AudioGuideID int identity(1,1) primary key,
    POIID int not null,
    LanguageCode varchar(10) not null,
    Title nvarchar(200) null,
    TextContent nvarchar(max) null,
    AudioUrl varchar(500) null,
    DurationSeconds int default 0,
    IsDeleted bit not null default 0,
    CreatedAt datetime not null default getdate(),
    UpdatedAt datetime null,

    constraint FK_AudioGuides_POI foreign key (POIID) 
        references PointsOfInterest(POIID) on delete cascade,
    constraint FK_AudioGuides_Language foreign key (LanguageCode) 
        references Languages(LanguageCode),
    constraint UQ_POI_Language unique (POIID, LanguageCode)
);
go

-- Kiem tra toan ven cho toa do va trang thai
alter table PointsOfInterest
add constraint CK_POI_Latitude check (Latitude between -90 and 90),
    constraint CK_POI_Longitude check (Longitude between -180 and 180),
    constraint CK_POI_Status check (Status in ('Active', 'Inactive'));
go