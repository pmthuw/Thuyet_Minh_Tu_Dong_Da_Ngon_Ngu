namespace Auralis.Api.Admin;
public class DeviceSession {
 public Guid Id {get;set;}
 public string TokenHash {get;set;} = "";
 public Guid DeviceId {get;set;}
 public int? UserID {get;set;}
 public string DeviceName {get;set;} = "";
 public DateTime CreatedAt {get;set;}
 public DateTime LastSeenAt {get;set;}
 public DateTime ExpiresAt {get;set;}
 public DateTime? RevokedAt {get;set;}
}
public class NarrationEvent {
 public Guid Id {get;set;}
 public Guid SessionId {get;set;}
 public int POIID {get;set;}
 public string LanguageCode {get;set;} = "";
 public DateTime StartedAt {get;set;}
}
