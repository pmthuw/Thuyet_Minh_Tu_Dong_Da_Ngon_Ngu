function POICard({ poi, selected, onClick }) {
  return (
    <button className={`poi-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className={`poi-thumb ${poi.color}`}>
        <span>⌂</span>
      </div>

      <div className="poi-content">
        <div className="poi-title-row">
          <strong>{poi.name}</strong>
          {selected && <span className="selected-dot">●</span>}
        </div>

        <div className="poi-category">{poi.category}</div>

        <div className="poi-meta">
          <span>★ {poi.rating}</span>
          <span>•</span>
          <span>{poi.distance}</span>
        </div>
      </div>

      <span className="poi-arrow">›</span>
    </button>
  )
}

export default POICard
