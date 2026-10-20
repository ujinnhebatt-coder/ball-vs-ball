import type { BattleResult } from '../types.ts'

interface ResultOverlayProps {
  result: BattleResult
  onRematch: () => void
  onChangeBalls: () => void
  onMainMenu: () => void
}

/** Layar hasil duel (GDD bagian 9). */
export function ResultOverlay({
  result,
  onRematch,
  onChangeBalls,
  onMainMenu,
}: ResultOverlayProps) {
  const winner = result.winnerId !== null
  const duration = result.duration.toFixed(1)

  return (
    <div className="overlay">
      <div className="result-panel">
        <span className="result-eyebrow">
          {winner ? 'Pemenang' : 'Seri — Timeout'}
        </span>
        <h2
          className="result-winner"
          style={winner ? { color: result.winnerColor ?? undefined } : undefined}
        >
          {winner ? result.winnerName : 'Tidak ada pemenang'}
        </h2>
        <p className="result-duration">Durasi duel: {duration} detik</p>

        <div className="result-table">
          <div className="result-row result-head">
            <span>Bola</span>
            <span>Damage</span>
            <span>Serangan</span>
            <span>Sisa HP</span>
          </div>
          {result.stats.map((stat) => (
            <div key={stat.id} className="result-row">
              <span className="result-name">
                <span className="hp-dot" style={{ background: stat.color }} />
                {stat.name}
              </span>
              <span>{stat.damageDealt}</span>
              <span>
                {stat.attacks}
                {stat.attacks > 0 ? ` (${Math.round((stat.hits / stat.attacks) * 100)}%)` : ''}
              </span>
              <span>{stat.hpLeft}</span>
            </div>
          ))}
        </div>

        <div className="result-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={onRematch}>
            Rematch
          </button>
          <button type="button" className="btn btn-secondary" onClick={onChangeBalls}>
            Change Balls
          </button>
          <button type="button" className="btn btn-ghost" onClick={onMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}
