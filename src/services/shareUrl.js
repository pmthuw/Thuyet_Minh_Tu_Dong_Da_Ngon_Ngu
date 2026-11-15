export function isLoopback(hostname) {
  return hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1' || hostname === '[::1]' || /^127\./.test(hostname) || hostname === '0.0.0.0'
}
export function checkedShareUrl(value) {
  const url = new URL(value.trim())
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Địa chỉ cần bắt đầu bằng http:// hoặc https://.')
  if (url.username || url.password) throw new Error('Link chia sẻ không được chứa tên đăng nhập hoặc mật khẩu.')
  if (isLoopback(url.hostname)) throw new Error('Điện thoại không mở được localhost hoặc 127.0.0.1 của máy tính. Hãy dùng địa chỉ Network.')
  if (url.search || url.hash) throw new Error('Hãy dùng link ứng dụng không chứa tham số hoặc mã phiên đăng nhập.')
  return url.href
}
export function currentAppUrl(origin, base = '/') {
  return new URL(base, origin).href
}
