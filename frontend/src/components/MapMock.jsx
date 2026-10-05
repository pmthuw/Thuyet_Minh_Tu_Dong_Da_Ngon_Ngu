function MapMock({ selectedPoi, routeMode, onSelect }) {
  const markers = [
    { id: 1, x: 38, y: 36, color: 'red' },
    { id: 2, x: 61, y: 28, color: 'blue' },
    { id: 3, x: 72, y: 54, color: 'orange' },
    { id: 4, x: 47, y: 69, color: 'green' },
  ]

  return (
    <div className="map">
      <div className="map-grid" />
      <div className="river" />
      <div className="park park-a" />
      <div className="park park-b" />

      <div className="road road-1" />
      <div className="road road-2" />
      <div className="road road-3" />
      <div className="road road-4" />
      <div className="road road-5" />

      {routeMode && (
        <svg className="route-line" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 25 80 C 35 70, 38 58, 47 52 S 58 42, 61 28" />
        </svg>
      )}

      {markers.map((marker) => (
        <button
          key={marker.id}
          className={`map-marker ${marker.color} ${selectedPoi.id === marker.id ? 'selected-marker' : ''}`}
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          onClick={() => onSelect({
            id: marker.id,
            name: ['Dinh Độc Lập', 'Nhà thờ Đức Bà', 'Bưu điện Trung tâm', 'Chợ Bến Thành'][marker.id - 1],
            category: ['Di tích', 'Kiến trúc', 'Kiến trúc', 'Mua sắm'][marker.id - 1],
            distance: ['0.8 km', '1.2 km', '1.4 km', '1.8 km'][marker.id - 1],
            duration: ['5 phút', '8 phút', '10 phút', '12 phút'][marker.id - 1],
            description: 'Điểm tham quan nổi bật trong khu vực trung tâm thành phố.',
            rating: [4.8, 4.7, 4.6, 4.5][marker.id - 1],
            color: marker.color,
          })}
          aria-label={`Địa điểm ${marker.id}`}
        >
          <span />
        </button>
      ))}

      <div className="user-location">
        <div className="accuracy-ring" />
        <div className="user-dot" />
      </div>

      <div className="map-attribution">Bản đồ minh họa • VoiceMap</div>
    </div>
  )
}

export default MapMock
