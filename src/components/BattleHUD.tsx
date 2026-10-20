import type { HudSnapshot } from '../types.ts'

interface BattleHUDProps {
  hud: HudSnapshot
  isPaused: boolean
  speed: number
  onTogglePause: () => void
  onRestart: () => void
  onSpeedChange: (speed: number) => void
  onQuit: () => void
}

const SPEED_OPTIONS = [0.5, 1, 2, 4]

/** HUD duel: bar HP, timer, kontrol simulasi (GDD bagian 9). */
export function BattleHUD({
  hud,
  isPaused,
  speed,
  onTogglePause,
  onRestart,
  onSpeedChange,
  onQuit,
}: BattleHUDProps) {
  const minutes = Math.floor(hud.elapsed / 60)
  const seconds = Math.floor(hud.elapsed % 60)
  const tenths = Math.floor((hud.elapsed % 1) * 10)
  const timer = `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`

  return (
    <div className="hud">
      <div className="hud-top">
        {hud.balls.map((ball) => {
          const ratio = Math.max(0, ball.hp / ball.maxHp)
          return (
            <div key={ball.id} className="hp-block">
              <div className="hp-head">
                <span className="hp-name">
                  <span className="hp-dot" style={{ background: ball.color }} />
                  {ball.name}
                </span>
                <span className="hp-value">
                  {ball.hp} / {ball.maxHp}
                </span>
              </div>
              <div className="hp-track">
                <div
                  className="hp-fill"
                  style={{
                    width: `${ratio * 100}%`,
                    background: ball.color,
                  }}
                />
              </div>
              <span className="hp-state">State: {ball.aiState}</span>
            </div>
          )
        })}

        <div className="timer">
          <span className="timer-value">{timer}</span>
          {isPaused && <span className="timer-paused">PAUSED</span>}
        </div>
      </div>

      <div className="hud-bottom">
        <div className="control-group">
          <button type="button" className="btn btn-secondary" onClick={onTogglePause}>
            {isPaused ? '▶ Lanjut' : '⏸ Pause'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onRestart}>
            ↻ Restart
          </button>
          <button type="button" className="btn btn-ghost" onClick={onQuit}>
            Keluar
          </button>
        </div>

        <div className="control-group speed-group" role="group" aria-label="Kecepatan simulasi">
          <span className="speed-label">Kecepatan</span>
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`btn btn-chip${speed === option ? ' is-active' : ''}`}
              onClick={() => onSpeedChange(option)}
            >
              {option}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
