import Icon from './Icon'

const BARS = Array.from({ length: 36 }, (_, i) => 22 + Math.round(Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 70))

export default function AudioPlayer({ name, langLabel, speech, text, t }) {
  const { playing, progress, supported, rate, toggle, cycleRate } = speech
  const total = Math.round(text.length / 14 / rate) // ước lượng ~14 ký tự/giây
  const left = Math.max(0, Math.round(total * (1 - progress)))
  const mmss = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`
  return (
    <div className={`audio ${playing ? 'playing' : ''}`} role="region" aria-label={t.narration}>
      <button className="play" onClick={toggle} disabled={!supported} aria-label={playing ? t.pause : progress > 0 ? t.resume : t.listen}>
        <Icon name={playing ? 'pause' : 'play'} size={20} />
      </button>
      <div className="audio-body">
        <div className="audio-head"><strong>{name}</strong><span>{langLabel}</span></div>
        <div className="wave" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          {BARS.map((h, i) => (
            <i key={i} className={i / BARS.length <= progress ? 'done' : ''} style={{ height: `${h}%`, '--d': `${(i % 7) * 70}ms` }} />
          ))}
        </div>
      </div>
      <div className="audio-side">
        <span>{supported ? `${mmss} ${t.left}` : t.noTts}</span>
        <button className="rate" onClick={cycleRate} title={t.speed} aria-label={`${t.speed} ${rate}×`}>{rate}×</button>
      </div>
    </div>
  )
}
