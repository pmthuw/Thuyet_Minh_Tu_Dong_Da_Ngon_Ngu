import { memo } from 'react'
import { CATS } from '../data'
import Icon from './Icon'
import { fmtDist } from '../hooks'

function POICard({ poi, name, catLabel, dist, selected, saved, onSelect, onToggleSave, saveLabel }) {
  const category = CATS[poi.cat]
  const hasRating = Number.isFinite(poi.rating)

  return (
    <div className={`poi-card ${selected ? 'selected' : ''}`}>
      <button className="poi-main" onClick={() => onSelect(poi.id)} aria-pressed={selected}>
        <span className="poi-dist" style={{ background: category?.color || '#0e6b68' }}>{fmtDist(dist)}</span>
        <span className="poi-text">
          <strong>{name}</strong>
          {(catLabel || hasRating || poi.address) && (
            <span>
              {[catLabel, hasRating ? `★ ${poi.rating}` : null].filter(Boolean).join(' · ') || poi.address}
            </span>
          )}
        </span>
      </button>
      <button className={`icon-btn ${saved ? 'on' : ''}`} onClick={() => onToggleSave(poi.id)} aria-label={saveLabel} aria-pressed={saved}>
        <Icon name="star" filled={saved} />
      </button>
    </div>
  )
}
export default memo(POICard)
