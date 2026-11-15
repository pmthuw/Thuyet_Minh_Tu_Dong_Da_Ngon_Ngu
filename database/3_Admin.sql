USE AuralisDB;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF NOT EXISTS(SELECT 1 FROM dbo.Languages WHERE LanguageCode='vi')
 INSERT dbo.Languages(LanguageCode,LanguageName,IsDefault,IsActive) VALUES('vi',N'Tiếng Việt',0,1);
IF NOT EXISTS(SELECT 1 FROM dbo.Languages WHERE IsDefault=1)
 UPDATE dbo.Languages SET IsDefault=1,IsActive=1 WHERE LanguageCode='vi';
IF COL_LENGTH('dbo.PointsOfInterest','RowVersion') IS NULL
 ALTER TABLE dbo.PointsOfInterest ADD RowVersion rowversion;
IF OBJECT_ID('dbo.DeviceSessions','U') IS NULL
BEGIN
 CREATE TABLE dbo.DeviceSessions(
  Id uniqueidentifier NOT NULL PRIMARY KEY,
  TokenHash varchar(64) NOT NULL UNIQUE,
  DeviceId uniqueidentifier NOT NULL,
  UserID int NULL REFERENCES dbo.Users(UserID),
  DeviceName nvarchar(200) NOT NULL,
  CreatedAt datetime2 NOT NULL,
  LastSeenAt datetime2 NOT NULL,
  ExpiresAt datetime2 NOT NULL,
  RevokedAt datetime2 NULL
 );
 CREATE INDEX IX_Sessions_Active ON dbo.DeviceSessions(ExpiresAt,RevokedAt) INCLUDE(DeviceId,UserID,LastSeenAt);
END;
IF OBJECT_ID('dbo.NarrationEvents','U') IS NULL
BEGIN
 CREATE TABLE dbo.NarrationEvents(
  Id uniqueidentifier NOT NULL PRIMARY KEY,
  SessionId uniqueidentifier NOT NULL REFERENCES dbo.DeviceSessions(Id),
  POIID int NOT NULL REFERENCES dbo.PointsOfInterest(POIID),
  LanguageCode varchar(10) NOT NULL REFERENCES dbo.Languages(LanguageCode),
  StartedAt datetime2 NOT NULL
 );
 CREATE INDEX IX_Narration_Date ON dbo.NarrationEvents(StartedAt,POIID);
END;
COMMIT;
GO
