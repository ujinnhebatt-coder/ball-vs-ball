import type { HudSnapshot } from '../types.ts'

interface BattleHUDProps {
  hud: HudSnapshot
  isPaused: boolean
  speed: number
  activeBallId: number
  onSelectBall: (ballId: number) => void
  onLaunch: () => void
  onRandomAim: () => void
  onTogglePause: () => void
  onRestart: () => void
  onSpeedChange: (speed: number) => void
  onQuit: () => void
}

const SPEED_OPTIONS = [0.5, 1, 2, 4]

/** HUD duel: panel aim sebelum duel, bar HP, timer, dan kontrol simulasi. */
export function BattleHUD({
  hud,
  isPaused,
  speed,
  activeBallId,
  onSelectBall,
  onLaunch,
  onRandomAim,
  onTogglePause,
  onRestart,
  onSpeedChange,
  onQuit,
}: BattleHUDProps) {
  const minutes = Math.floor(hud.elapsed / 60)
  const seconds = Math.floor(hud.elapsed % 60)
  const tenths = Math.floor((hud.elapsed % 1) * 10)
  const timer = `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`
  const isAimPhase = hud.phase === 'aim'

  return (
    <div className="hud">
      {isAimPhase ? (
        <div className="aim-panel">
          <div className="aim-head">
            <div>
              <h2 className="aim-title">Tentukan Arah Luncur</h2>
              <p className="aim-hint">
                Klik dan seret panah pada arena (atau klik bola) untuk memutar arah
                tiap bola sebelum duel dimulai.
              </p>
            </div>
            <div className="aim-actions">
              <button type="button" className="btn btn-secondary" onClick={onRandomAim}>
                Acak Arah
              </button>
              <button type="button" className="btn btn-primary btn-lg" onClick={onLaunch}>
                Mulai Duel
              </button>
            </div>
          </div>

          <div className="aim-balls">
            {hud.balls.map((ball) => {
              const degrees = Math.round(((ball.aimAngle * 180) / Math.PI + 360) % 360)
              const isActive = ball.id === activeBallId
              return (
                <button
                  key={ball.id}
                  type="button"
                  className={`aim-card${isActive ? ' is-active' : ''}`}
                  onClick={() => onSelectBall(ball.id)}
                  aria-pressed={isActive}
                >
                  <span className="aim-dot" style={{ background: ball.color }} />
                  <span className="aim-name">{ball.name}</span>
                  <span className="aim-angle">{degrees}°</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <>
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

            <div
              className="control-group speed-group"
              role="group"
              aria-label="Kecepatan simulasi"
            >
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
        </>
      )}
    </div>
  )
}
