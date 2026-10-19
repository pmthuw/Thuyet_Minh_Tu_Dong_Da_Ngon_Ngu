import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import MapMock from './components/MapMock'
import POICard from './components/POICard'
import AudioPlayer from './components/AudioPlayer'
import Icon from './components/Icon'
import { CATS, LANGS, POIS, UI } from './data'
import { fmtDist, haversine, norm, useGeo, useLocalStorage, useSpeech, useToast, walkMin } from './hooks'

export default function App() {
  const [langCode, setLangCode] = useLocalStorage('auralis:lang', 'vi')
  const [saved, setSaved] = useLocalStorage('auralis:saved', [])
  const [selectedId, setSelectedId] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | saved | <cat>
  const [sortBy, setSortBy] = useState('distance')
  const [menu, setMenu] = useState(false)
  const [routing, setRouting] = useState(false)
  const [toast, notify] = useToast()
  const { pos, status, locate } = useGeo()
  const mapApi = useRef({})
  const searchRef = useRef(null)
  const langWrap = useRef(null)

  const lang = LANGS.find((l) => l.code === langCode) || LANGS[0]
  const t = UI[lang.code] || UI.en
  const catName = (c) => CATS[c][lang.code] || CATS[c].en
  const pick = (p) => p.tr[lang.code] ? { text: p.tr[lang.code], locale: lang.locale } : { text: p.tr.en, locale: 'en-US' }

  const list = useMemo(() => {
    const q = norm(search.trim())
    return POIS.map((p) => ({ ...p, dist: haversine(pos, p) }))
      .filter((p) => (filter === 'all' ? true : filter === 'saved' ? saved.includes(p.id) : p.cat === filter))
      .filter((p) => !q || norm(`${p.name} ${CATS[p.cat].vi} ${CATS[p.cat].en}`).includes(q))
      .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : sortBy === 'name' ? a.name.localeCompare(b.name, 'vi') : a.dist - b.dist)
  }, [search, filter, sortBy, saved, pos])

  const selected = useMemo(() => {
    const p = POIS.find((x) => x.id === selectedId)
    return p && { ...p, dist: haversine(pos, p) }
  }, [selectedId, pos])

  const narration = selected ? pick(selected) : { text: '', locale: lang.locale }
  const speech = useSpeech(narration.text, narration.locale)

  // Phím tắt: "/" để tìm kiếm, Esc để đóng thẻ / xoá tìm kiếm; bấm ra ngoài đóng menu ngôn ngữ
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') { setMenu(false); if (search) setSearch(''); else setSelectedId(null) }
    }
    const onClick = (e) => { if (langWrap.current && !langWrap.current.contains(e.target)) setMenu(false) }
    window.addEventListener('keydown', onKey); window.addEventListener('click', onClick)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onClick) }
  }, [search])

  useEffect(() => {
    const msg = { loading: t.locating, ok: t.located, denied: t.denied, far: t.far }[status]
    if (msg) notify(msg)
    if (status === 'ok') mapApi.current.centerOn?.(pos)
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSave = (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const listen = () => { if (!speech.supported) notify(t.noTts); else { speech.toggle(); if (!selected.tr[lang.code]) notify(t.fallback) } }
  const filters = [['all', t.all], ['saved', `${t.saved}${saved.length ? ` (${saved.length})` : ''}`], ...Object.keys(CATS).map((c) => [c, catName(c)])]
  const isSaved = selected && saved.includes(selected.id)

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => { setSelectedId(null); setSearch(''); setFilter('all') }}>
          <span className="logo" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <span><b>AURALIS</b><small>{t.tagline}</small></span>
        </button>
        <div className="top-actions">
          <button className="btn" onClick={locate}><Icon name="locate" size={16} /><span className="hide-sm">{t.locate}</span></button>
          <div className="lang" ref={langWrap}>
            <button className="btn" onClick={() => setMenu((v) => !v)} aria-haspopup="listbox" aria-expanded={menu}>
              <Icon name="globe" size={16} />{lang.label}<Icon name="chevron" size={14} />
            </button>
            {menu && (
              <ul className="menu" role="listbox">
                {LANGS.map((l) => (
                  <li key={l.code}><button role="option" aria-selected={l.code === langCode} className={l.code === langCode ? 'on' : ''}
                    onClick={() => { setLangCode(l.code); setMenu(false) }}>{l.label}</button></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      <main className="layout">
        <aside className="side">
          <h1>{t.explore}</h1>
          <label className="search">
            <Icon name="search" size={17} />
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} />
            {search && <button type="button" onClick={() => setSearch('')} aria-label={t.close}><Icon name="x" size={15} /></button>}
          </label>
          <div className="chips" role="group">
            {filters.map(([k, label]) => (
              <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)} aria-pressed={filter === k}>
                {CATS[k] && <i style={{ background: CATS[k].color }} />}{label}
              </button>
            ))}
          </div>
          <div className="list-head">
            <span>{t.count(list.length)}</span>
            <label>{t.sort}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="distance">{t.distance}</option><option value="rating">{t.rating}</option><option value="name">{t.name}</option>
              </select>
            </label>
          </div>
          <div className="list">
            {list.map((p) => (
              <POICard key={p.id} poi={p} name={p.name} catLabel={catName(p.cat)} dist={p.dist} selected={p.id === selectedId}
                saved={saved.includes(p.id)} onSelect={setSelectedId} onToggleSave={toggleSave} saveLabel={saved.includes(p.id) ? t.unsave : t.save} />
            ))}
            {list.length === 0 && (
              <div className="empty"><strong>{filter === 'saved' && !search ? t.noSaved : t.empty}</strong>
                {!(filter === 'saved' && !search) && <span>{t.emptyHint}</span>}</div>
            )}
          </div>
        </aside>

        <section className="stage">
          <MapMock pois={POIS} selectedId={selectedId} user={pos} speaking={speech.playing} zoomRef={mapApi}
            routeTo={routing && selected ? selected : null} onSelect={setSelectedId}
            labels={{ map: 'Map', name: (p) => p.name }} />

          <div className="zoom">
            <button onClick={locate} aria-label={t.locate}><Icon name="locate" /></button>
            <button onClick={() => mapApi.current.zoom?.(1.3)} aria-label={t.zoomIn}><Icon name="plus" /></button>
            <button onClick={() => mapApi.current.zoom?.(1 / 1.3)} aria-label={t.zoomOut}><Icon name="minus" /></button>
          </div>

          {routing && selected && (
            <div className="route-bar">
              <span>{t.routing} <b>{selected.name}</b> · {fmtDist(selected.dist)}</span>
              <button onClick={() => setRouting(false)}>{t.endRoute}</button>
            </div>
          )}

          {selected && (
            <div className="dock">
              <article className="info" style={{ '--c': CATS[selected.cat].color }}>
                <header>
                  <span className="tag">{catName(selected.cat)}</span>
                  <button className={`icon-btn ${isSaved ? 'on' : ''}`} onClick={() => toggleSave(selected.id)} aria-label={isSaved ? t.unsave : t.save} aria-pressed={isSaved}><Icon name="star" filled={isSaved} /></button>
                  <button className="icon-btn" onClick={() => setSelectedId(null)} aria-label={t.close}><Icon name="x" /></button>
                </header>
                <h2>{selected.name}</h2>
                <p>{narration.text}</p>
                <div className="meta">
                  <span>★ {selected.rating}</span>
                  <span>{fmtDist(selected.dist)}</span>
                  <span><Icon name="walk" size={14} /> {walkMin(selected.dist)} {t.min} {t.walk}</span>
                </div>
                <div className="actions">
                  <button className="primary" onClick={() => { setRouting(true); notify(`${t.routing} ${selected.name}`) }}><Icon name="route" size={16} />{t.route}</button>
                  <button className="soft" onClick={listen}><Icon name={speech.playing ? 'pause' : 'play'} size={16} />{speech.playing ? t.pause : speech.progress > 0 ? t.resume : t.listen}</button>
                </div>
              </article>
              <AudioPlayer name={selected.name} langLabel={narration.locale === lang.locale ? lang.label : 'English'} speech={speech} text={narration.text} t={t} />
            </div>
          )}
        </section>
      </main>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
