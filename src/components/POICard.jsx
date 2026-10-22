import { memo } from 'react'
import { CATS } from '../data'
import Icon from './Icon'
import { fmtDist } from '../hooks'

function POICard({ poi, name, catLabel, dist, selected, saved, onSelect, onToggleSave, saveLabel }) {
  return (
    <div className={`poi-card ${selected ? 'selected' : ''}`}>
      <button className="poi-main" onClick={() => onSelect(poi.id)} aria-pressed={selected}>
        <span className="poi-dist" style={{ background: CATS[poi.cat].color }}>{fmtDist(dist)}</span>
        <span className="poi-text">
          <strong>{name}</strong>
          <span>{catLabel} · ★ {poi.rating}</span>
        </span>
      </button>
      <button className={`icon-btn ${saved ? 'on' : ''}`} onClick={() => onToggleSave(poi.id)} aria-label={saveLabel} aria-pressed={saved}>
        <Icon name="star" filled={saved} />
      </button>
    </div>
  )
}
export default memo(POICard)
