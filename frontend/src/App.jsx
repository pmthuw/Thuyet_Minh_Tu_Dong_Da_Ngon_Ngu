import { useMemo, useState } from 'react'
import './App.css'
import MapMock from './components/MapMock'
import POICard from './components/POICard'
import AudioPlayer from './components/AudioPlayer'

const initialPois = [
  {
    id: 1,
    name: 'Dinh Độc Lập',
    category: 'Di tích',
    distance: '0.8 km',
    duration: '5 phút',
    description: 'Công trình lịch sử nổi bật tại trung tâm TP. Hồ Chí Minh.',
    rating: 4.8,
    color: 'red',
  },
  {
    id: 2,
    name: 'Nhà thờ Đức Bà',
    category: 'Kiến trúc',
    distance: '1.2 km',
    duration: '8 phút',
    description: 'Một trong những công trình kiến trúc tiêu biểu của thành phố.',
    rating: 4.7,
    color: 'blue',
  },
  {
    id: 3,
    name: 'Bưu điện Trung tâm',
    category: 'Kiến trúc',
    distance: '1.4 km',
    duration: '10 phút',
    description: 'Công trình mang phong cách kiến trúc châu Âu giữa lòng thành phố.',
    rating: 4.6,
    color: 'orange',
  },
  {
    id: 4,
    name: 'Chợ Bến Thành',
    category: 'Mua sắm',
    distance: '1.8 km',
    duration: '12 phút',
    description: 'Điểm tham quan và mua sắm nổi tiếng của TP. Hồ Chí Minh.',
    rating: 4.5,
    color: 'green',
  },
]

function App() {
  const [language, setLanguage] = useState('Tiếng Việt')
  const [selectedPoi, setSelectedPoi] = useState(initialPois[0])
  const [search, setSearch] = useState('')
  const [showLanguage, setShowLanguage] = useState(false)
  const [routeMode, setRouteMode] = useState(false)
  const [toast, setToast] = useState('')

  const languages = ['Tiếng Việt', 'English', '中文', '한국어']

  const filteredPois = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return initialPois
    return initialPois.filter((poi) =>
      `${poi.name} ${poi.category}`.toLowerCase().includes(keyword),
    )
  }, [search])

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => setSelectedPoi(initialPois[0])}>
          <div className="brand-mark">V</div>
          <div>
            <div className="brand-name">VoiceMap</div>
            <div className="brand-subtitle">Khám phá bằng giọng nói</div>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="ghost-btn" onClick={() => notify('Đã bật định vị GPS')}>
            <span>⌖</span> Vị trí của tôi
          </button>

          <div className="language-wrap">
            <button
              className="language-btn"
              onClick={() => setShowLanguage((value) => !value)}
            >
              <span>◎</span> {language} <span className="chevron">⌄</span>
            </button>

            {showLanguage && (
              <div className="language-menu">
                {languages.map((item) => (
                  <button
                    key={item}
                    className={item === language ? 'active-language' : ''}
                    onClick={() => {
                      setLanguage(item)
                      setShowLanguage(false)
                      notify(`Đã chuyển sang ${item}`)
                    }}
                  >
                    {item}
                    {item === language && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="avatar" onClick={() => notify('Khu vực tài khoản')}>
            U
          </button>
        </div>
      </header>

      <main className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-heading">
            <div>
              <span className="eyebrow">EXPLORE</span>
              <h1>Khám phá địa điểm</h1>
            </div>
            <button className="filter-btn" onClick={() => notify('Bộ lọc đang được mở')}>
              ☷
            </button>
          </div>

          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm địa điểm..."
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Xóa tìm kiếm">
                ×
              </button>
            )}
          </div>

          <div className="quick-filters">
            <button className="chip active">Gần tôi</button>
            <button className="chip">Di tích</button>
            <button className="chip">Ẩm thực</button>
            <button className="chip">Kiến trúc</button>
          </div>

          <div className="poi-header">
            <span>{filteredPois.length} địa điểm gần đây</span>
            <button onClick={() => notify('Đang sắp xếp theo khoảng cách')}>Khoảng cách ▾</button>
          </div>

          <div className="poi-list">
            {filteredPois.map((poi) => (
              <POICard
                key={poi.id}
                poi={poi}
                selected={selectedPoi.id === poi.id}
                onClick={() => setSelectedPoi(poi)}
              />
            ))}

            {filteredPois.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⌕</div>
                <strong>Không tìm thấy địa điểm</strong>
                <span>Thử một từ khóa khác.</span>
              </div>
            )}
          </div>
        </aside>

        <section className="map-area">
          <MapMock
            selectedPoi={selectedPoi}
            routeMode={routeMode}
            onSelect={setSelectedPoi}
          />

          <div className="map-search">
            <span>⌕</span>
            <input placeholder="Tìm kiếm trên bản đồ" />
          </div>

          <div className="map-controls">
            <button onClick={() => notify('Đang lấy vị trí hiện tại')} title="Vị trí của tôi">⌖</button>
            <button onClick={() => notify('Đã phóng to bản đồ')} title="Phóng to">＋</button>
            <button onClick={() => notify('Đã thu nhỏ bản đồ')} title="Thu nhỏ">−</button>
          </div>

          <div className="map-info-card">
            <div className="map-info-top">
              <div className={`mini-marker ${selectedPoi.color}`}>●</div>
              <div>
                <span className="small-label">{selectedPoi.category}</span>
                <h2>{selectedPoi.name}</h2>
              </div>
              <button
                className="close-card"
                onClick={() => notify('Đã đóng thông tin')}
              >
                ×
              </button>
            </div>

            <p>{selectedPoi.description}</p>

            <div className="info-meta">
              <span>★ {selectedPoi.rating}</span>
              <span>⌖ {selectedPoi.distance}</span>
              <span>◷ {selectedPoi.duration}</span>
            </div>

            <div className="card-actions">
              <button
                className="route-btn"
                onClick={() => {
                  setRouteMode(true)
                  notify(`Đang tạo tuyến đến ${selectedPoi.name}`)
                }}
              >
                Chỉ đường
              </button>
              <button className="listen-btn" onClick={() => notify('Đang phát thuyết minh')}>
                ▶ Nghe thuyết minh
              </button>
            </div>
          </div>

          <AudioPlayer poi={selectedPoi} language={language} />

          {routeMode && (
            <div className="route-banner">
              <div>
                <span className="eyebrow">ROUTE</span>
                <strong>Đang dẫn đường đến {selectedPoi.name}</strong>
              </div>
              <button
                onClick={() => {
                  setRouteMode(false)
                  notify('Đã kết thúc tuyến đường')
                }}
              >
                Kết thúc
              </button>
            </div>
          )}
        </section>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App
