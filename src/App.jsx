import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import GoogleMap from './components/GoogleMap'
import POICard from './components/POICard'
import AudioPlayer from './components/AudioPlayer'
import Icon from './components/Icon'
import { CATS, LANGS, POIS, UI } from './data'
import {
  fmtDist,
  haversine,
  norm,
  useGeo,
  useLocalStorage,
  useSpeech,
  useToast,
  walkMin,
} from './hooks'
import { getPois, getGoogleDirectionsLink } from './services/api'
import { googleDirectionsUrl } from './services/googleMaps'

export default function App() {
  const [langCode, setLangCode] = useLocalStorage('auralis:lang', 'vi')
  const [saved, setSaved] = useLocalStorage('auralis:saved', [])
  const [selectedId, setSelectedId] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('distance')
  const [menu, setMenu] = useState(false)
  const [travelMode, setTravelMode] = useLocalStorage('auralis:travel', 'walking')
  const [pois, setPois] = useState(POIS)
  const [apiStatus, setApiStatus] = useState('loading')
  const [backendRoute, setBackendRoute] = useState(null)
  const [toast, notify] = useToast()

  const { pos, status, locate } = useGeo()
  const searchRef = useRef(null)
  const langWrap = useRef(null)

  const lang = LANGS.find((l) => l.code === langCode) || LANGS[0]
  const t = UI[lang.code] || UI.en
  const catName = (cat) => CATS[cat]?.[lang.code] || CATS[cat]?.en || cat

  const pick = (poi) => {
    const translated = poi.tr?.[lang.code]
    if (translated) return { text: translated, locale: lang.locale }
    const fallbackCode = Object.keys(poi.tr || {}).find((code) => poi.tr[code] && LANGS.some((l) => l.code === code))
    return { text: poi.tr?.[fallbackCode] || '', locale: LANGS.find((l) => l.code === fallbackCode)?.locale || lang.locale }
  }

  const list = useMemo(() => {
    const q = norm(search.trim())
    return pois
      .map((poi) => ({ ...poi, dist: haversine(pos, poi) }))
      .filter((poi) =>
        filter === 'all'
          ? true
          : filter === 'saved'
            ? saved.includes(poi.id)
            : poi.cat === filter
      )
      .filter((poi) =>
        !q || norm(`${poi.name} ${CATS[poi.cat]?.vi || ''} ${CATS[poi.cat]?.en || ''}`).includes(q)
      )
      .sort((a, b) =>
        sortBy === 'rating'
          ? b.rating - a.rating
          : sortBy === 'name'
            ? a.name.localeCompare(b.name, 'vi')
            : a.dist - b.dist
      )
  }, [search, filter, sortBy, saved, pos, pois])

  const selected = useMemo(() => {
    const poi = pois.find((item) => item.id === selectedId)
    return poi ? { ...poi, dist: haversine(pos, poi) } : null
  }, [selectedId, pos, pois])

  useEffect(() => {
    const controller = new AbortController()
    getPois({ signal: controller.signal })
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('Invalid POI response')
        setPois(items)
        setApiStatus('connected')
      })
      .catch(() => {
        if (!controller.signal.aborted) setApiStatus('demo')
      })
    return () => controller.abort()
  }, [])

  const routeSignature = `${selected?.id}/${selected?.lat}/${selected?.lng}/${travelMode}/${langCode}/${status === 'ok' ? `${pos.lat},${pos.lng}` : 'gps-unknown'}`

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    setBackendRoute(null)
    getGoogleDirectionsLink(status === 'ok' ? pos : null, selected, travelMode, langCode, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted && result?.mode === travelMode && typeof result.url === 'string' && result.url.startsWith('https://www.google.com/maps/dir/')) {
          setBackendRoute({ signature: routeSignature, url: result.url })
        }
      })
      .catch(() => { /* Google Maps URLs có thể tạo ngay cả khi backend mất kết nối. */ })
    return () => controller.abort()
  }, [routeSignature]) // eslint-disable-line react-hooks/exhaustive-deps

  const openDirections = () => {
    if (!selected) return
    const url = (backendRoute?.signature === routeSignature ? backendRoute.url : null) || googleDirectionsUrl(selected, {
      origin: status === 'ok' ? pos : null,
      mode: travelMode,
      language: langCode,
    })
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
    if (status !== 'ok') notify(t.gpsHint)
  }

  const narration = selected ? pick(selected) : { text: '', locale: lang.locale }
  const speech = useSpeech(narration.text, narration.locale)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setMenu(false)
        if (search) setSearch('')
        else setSelectedId(null)
      }
    }
    const onClick = (event) => {
      if (langWrap.current && !langWrap.current.contains(event.target)) setMenu(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
  }, [search])

  useEffect(() => {
    const message = {
      loading: t.locating,
      ok: t.located,
      denied: t.denied,
      far: t.far,
    }[status]
    if (message) notify(message)
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSave = (id) => {
    setSaved((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
    )
  }

  const listen = () => {
    if (!speech.supported) {
      notify(t.noTts)
      return
    }
    speech.toggle()
    if (selected && !selected.tr?.[lang.code]) notify(t.fallback)
  }

  const filters = [
    ['all', t.all],
    ['saved', `${t.saved}${saved.length ? ` (${saved.length})` : ''}`],
    ...Object.keys(CATS).map((cat) => [cat, catName(cat)]),
  ]
  const isSaved = selected ? saved.includes(selected.id) : false

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setSelectedId(null)
            setSearch('')
            setFilter('all')
          }}
        >
          <span className="logo" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <span><b>AURALIS</b><small>{t.tagline}</small></span>
        </button>

        <div className="top-actions">
          <button className="btn" onClick={locate}>
            <Icon name="locate" size={16} />
            <span className="hide-sm">{t.locate}</span>
          </button>
          <div className="lang" ref={langWrap}>
            <button
              className="btn"
              onClick={() => setMenu((value) => !value)}
              aria-haspopup="listbox"
              aria-expanded={menu}
            >
              <Icon name="globe" size={16} />
              {lang.label}
              <Icon name="chevron" size={14} />
            </button>
            {menu && (
              <ul className="menu" role="listbox">
                {LANGS.map((item) => (
                  <li key={item.code}>
                    <button
                      role="option"
                      aria-selected={item.code === langCode}
                      className={item.code === langCode ? 'on' : ''}
                      onClick={() => {
                        setLangCode(item.code)
                        setMenu(false)
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      <main className="layout">
        <aside className="side">
          <h1>{t.explore}</h1>
          {apiStatus === 'demo' && (
            <p className="api-alert" role="status">{t.apiOffline}</p>
          )}

          <label className="search">
            <Icon name="search" size={17} />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.search}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label={t.close}>
                <Icon name="x" size={15} />
              </button>
            )}
          </label>

          <div className="chips" role="group">
            {filters.map(([key, label]) => (
              <button
                key={key}
                className={`chip ${filter === key ? 'on' : ''}`}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
              >
                {CATS[key] && <i style={{ background: CATS[key].color }} />}
                {label}
              </button>
            ))}
          </div>

          <div className="list-head">
            <span>{t.count(list.length)}</span>
            <label>
              {t.sort}
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="distance">{t.distance}</option>
                <option value="rating">{t.rating}</option>
                <option value="name">{t.name}</option>
              </select>
            </label>
          </div>

          <div className="list">
            {list.map((poi) => (
              <POICard
                key={poi.id}
                poi={poi}
                name={poi.name}
                catLabel={catName(poi.cat)}
                dist={poi.dist}
                selected={poi.id === selectedId}
                saved={saved.includes(poi.id)}
                onSelect={setSelectedId}
                onToggleSave={toggleSave}
                saveLabel={saved.includes(poi.id) ? t.unsave : t.save}
              />
            ))}
            {list.length === 0 && (
              <div className="empty">
                <strong>{filter === 'saved' && !search ? t.noSaved : t.empty}</strong>
                {!(filter === 'saved' && !search) && <span>{t.emptyHint}</span>}
              </div>
            )}
          </div>
        </aside>

        <section className="stage">
          <GoogleMap selected={selected} language={langCode} title={t.googleMap} />

          {selected && (
            <div className="dock">
              <article className="info" style={{ '--c': CATS[selected.cat]?.color || '#777' }}>
                <header>
                  <span className="tag">{catName(selected.cat)}</span>
                  <button
                    className={`icon-btn ${isSaved ? 'on' : ''}`}
                    onClick={() => toggleSave(selected.id)}
                    aria-label={isSaved ? t.unsave : t.save}
                    aria-pressed={isSaved}
                  >
                    <Icon name="star" filled={isSaved} />
                  </button>
                  <button className="icon-btn" onClick={() => setSelectedId(null)} aria-label={t.close}>
                    <Icon name="x" />
                  </button>
                </header>
                <h2>{selected.name}</h2>
                <p>{narration.text}</p>
                <div className="meta">
                  <span>★ {selected.rating}</span>
                  <span>{fmtDist(selected.dist)}</span>
                  <span><Icon name="walk" size={14} /> {walkMin(selected.dist)} {t.min} {t.walk}</span>
                </div>

                <div className="travel-options" aria-label={t.route}>
                  <label>
                    <input
                      type="radio"
                      name="travelmode"
                      checked={travelMode === 'walking'}
                      onChange={() => setTravelMode('walking')}
                    />
                    {t.walking}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="travelmode"
                      checked={travelMode === 'motorcycle'}
                      onChange={() => setTravelMode('motorcycle')}
                    />
                    {t.motorcycle}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="travelmode"
                      checked={travelMode === 'driving'}
                      onChange={() => setTravelMode('driving')}
                    />
                    {t.driving}
                  </label>
                </div>

                <div className="actions">
                  <button className="primary" onClick={openDirections}>
                    <Icon name="route" size={16} />
                    {t.route}
                  </button>
                  <button className="soft" onClick={listen}>
                    <Icon name={speech.playing ? 'pause' : 'play'} size={16} />
                    {speech.playing ? t.pause : speech.progress > 0 ? t.resume : t.listen}
                  </button>
                </div>
              </article>
              <AudioPlayer
                name={selected.name}
                langLabel={LANGS.find((item) => item.locale === narration.locale)?.label || lang.label}
                speech={speech}
                text={narration.text}
                t={t}
              />
            </div>
          )}
        </section>
      </main>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
