export const CATS = {
  heritage: { color: '#b5483a', vi: 'Di tích', en: 'Heritage' },
  arch: { color: '#3f6f9e', vi: 'Kiến trúc', en: 'Architecture' },
  shop: { color: '#c9822b', vi: 'Mua sắm', en: 'Shopping' },
  food: { color: '#4f8a4a', vi: 'Ẩm thực', en: 'Food & drink' },
}

export const LANGS = [
  { code: 'vi', label: 'Tiếng Việt', locale: 'vi-VN' },
  { code: 'en', label: 'English', locale: 'en-US' },
  { code: 'zh', label: '中文', locale: 'zh-CN' },
  { code: 'ko', label: '한국어', locale: 'ko-KR' },
]

// Điểm mặc định khi chưa bật GPS (gần Nhà hát Thành phố)
export const DEFAULT_POS = { lat: 10.7766, lng: 106.7032 }

// Bản dịch zh/ko chưa có nội dung → tự dùng English (xem pick() trong App)
export const POIS = [
  { id: 1, name: 'Dinh Độc Lập', cat: 'heritage', lat: 10.777, lng: 106.6954, rating: 4.8,
    tr: { vi: 'Công trình lịch sử gắn với ngày 30/4/1975, nay là bảo tàng. Bạn có thể đi qua phòng họp nội các, hầm chỉ huy và sân thượng nơi trực thăng từng đáp.',
          en: 'A landmark tied to 30 April 1975, now a museum. Walk through the cabinet room, the command bunker and the rooftop helipad.' } },
  { id: 2, name: 'Nhà thờ Đức Bà', cat: 'arch', lat: 10.7798, lng: 106.699, rating: 4.7,
    tr: { vi: 'Nhà thờ gạch đỏ xây cuối thế kỷ 19 với hai tháp chuông cao 58 mét, vật liệu được chở từ Pháp sang.',
          en: 'A red-brick cathedral from the late 19th century with twin 58-metre bell towers. Its bricks were shipped from France.' } },
  { id: 3, name: 'Bưu điện Trung tâm', cat: 'arch', lat: 10.7800, lng: 106.7000, rating: 4.6,
    tr: { vi: 'Bưu điện kiến trúc Pháp với mái vòm sắt và bản đồ cổ trên tường. Vẫn đang hoạt động, bạn có thể gửi bưu thiếp tại quầy.',
          en: 'A French-era post office with an iron-vaulted hall and old maps on the walls. Still working: send a postcard from the counter.' } },
  { id: 4, name: 'Chợ Bến Thành', cat: 'shop', lat: 10.7725, lng: 106.698, rating: 4.5,
    tr: { vi: 'Khu chợ biểu tượng từ năm 1914. Ban ngày bán đồ lưu niệm và đặc sản, buổi tối là chợ đêm với nhiều quán ăn.',
          en: 'The city’s iconic market since 1914. Souvenirs and local specialties by day, a night market with food stalls after dark.' } },
  { id: 5, name: 'Bảo tàng Chứng tích Chiến tranh', cat: 'heritage', lat: 10.7794, lng: 106.6922, rating: 4.7,
    tr: { vi: 'Bảo tàng trưng bày hình ảnh và hiện vật về chiến tranh Việt Nam. Nên dành ít nhất một giờ để tham quan.',
          en: 'A museum of photographs and artefacts from the Vietnam War. Allow at least an hour for the visit.' } },
  { id: 6, name: 'Cà phê chung cư 42 Nguyễn Huệ', cat: 'food', lat: 10.7745, lng: 106.704, rating: 4.4,
    tr: { vi: 'Tòa chung cư cũ nay là dãy quán cà phê trên từng tầng. Lên tầng cao để nhìn xuống phố đi bộ Nguyễn Huệ.',
          en: 'An old apartment block turned into stacked cafés. Head up for a view over Nguyen Hue walking street.' } },
]

export const UI = {
  vi: { tagline: 'Khám phá bằng giọng nói', explore: 'Khám phá địa điểm', search: 'Tìm địa điểm… (nhấn /)', all: 'Tất cả', saved: 'Đã lưu',
    count: (n) => `${n} địa điểm`, sort: 'Sắp xếp', distance: 'Gần nhất', rating: 'Đánh giá', name: 'Tên A–Z',
    empty: 'Không tìm thấy địa điểm', emptyHint: 'Thử từ khóa khác hoặc bỏ bộ lọc.', noSaved: 'Chưa lưu địa điểm nào. Nhấn dấu sao để lưu.',
    route: 'Chỉ đường', endRoute: 'Kết thúc', routing: 'Đang đi đến', listen: 'Nghe thuyết minh', pause: 'Tạm dừng', resume: 'Phát tiếp',
    narration: 'Thuyết minh', locate: 'Vị trí của tôi', zoomIn: 'Phóng to', zoomOut: 'Thu nhỏ', close: 'Đóng', save: 'Lưu', unsave: 'Bỏ lưu',
    walk: 'đi bộ', min: 'phút', located: 'Đã cập nhật vị trí', locating: 'Đang xác định vị trí…', denied: 'Không truy cập được vị trí. Hãy cho phép trong trình duyệt.',
    far: 'Bạn đang ở ngoài khu vực demo, dùng vị trí mẫu.', noTts: 'Trình duyệt không hỗ trợ đọc thuyết minh.', fallback: 'Chưa có bản dịch, đang dùng English.',
    speed: 'Tốc độ đọc', left: 'còn' },
  en: { tagline: 'Explore by voice', explore: 'Explore places', search: 'Search places… (press /)', all: 'All', saved: 'Saved',
    count: (n) => `${n} place${n === 1 ? '' : 's'}`, sort: 'Sort', distance: 'Nearest', rating: 'Rating', name: 'Name A–Z',
    empty: 'No places found', emptyHint: 'Try another keyword or clear the filter.', noSaved: 'Nothing saved yet. Tap the star to save a place.',
    route: 'Directions', endRoute: 'End', routing: 'Heading to', listen: 'Listen to guide', pause: 'Pause', resume: 'Resume',
    narration: 'Audio guide', locate: 'My location', zoomIn: 'Zoom in', zoomOut: 'Zoom out', close: 'Close', save: 'Save', unsave: 'Remove',
    walk: 'walk', min: 'min', located: 'Location updated', locating: 'Finding your location…', denied: 'Location unavailable. Allow access in your browser.',
    far: 'You are outside the demo area, using a sample location.', noTts: 'This browser cannot read the guide aloud.', fallback: 'No translation yet, using English.',
    speed: 'Speech speed', left: 'left' },
}
