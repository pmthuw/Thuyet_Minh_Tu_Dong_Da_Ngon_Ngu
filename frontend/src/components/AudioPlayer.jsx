import { useState } from 'react'

function AudioPlayer({ poi, language }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(38)

  return (
    <div className="audio-player">
      <div className="audio-icon">🔊</div>

      <div className="audio-main">
        <div className="audio-title-row">
          <strong>Thuyết minh tự động</strong>
          <span>{language}</span>
        </div>

        <div className="audio-subtitle">{poi.name}</div>

        <div className="audio-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>01:24</span>
        </div>
      </div>

      <button className="play-btn" onClick={() => setPlaying((value) => !value)}>
        {playing ? 'Ⅱ' : '▶'}
      </button>

      <input
        className="volume"
        type="range"
        min="0"
        max="100"
        defaultValue="70"
        aria-label="Âm lượng"
      />
    </div>
  )
}

export default AudioPlayer
