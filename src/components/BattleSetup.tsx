import type { CSSProperties } from 'react'
import { BALL_CLASS_ORDER, getBallClass } from '../game/BallClasses.ts'
import type { BallClassId } from '../types.ts'

interface BattleSetupProps {
  classA: BallClassId
  classB: BallClassId
  onChange: (classA: BallClassId, classB: BallClassId) => void
  onStart: () => void
  onBack: () => void
}

/** Layar Battle Setup: pilih dua kelas bola (GDD bagian 9). */
export function BattleSetup({
  classA,
  classB,
  onChange,
  onStart,
  onBack,
}: BattleSetupProps) {
  const randomMatchup = () => {
    const pool = [...BALL_CLASS_ORDER]
    const first = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
    const second = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
    onChange(first, second)
  }

  const swap = () => onChange(classB, classA)

  return (
    <div className="screen setup-screen">
      <header className="screen-header">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Menu Utama
        </button>
        <h1 className="screen-title">Battle Setup</h1>
        <div className="header-spacer" />
      </header>

      <div className="setup-layout">
        <BallPicker
          label="Pemain 1"
          selected={classA}
          other={classB}
          onSelect={(id) => onChange(id, classB)}
        />

        <div className="setup-actions">
          <button type="button" className="btn btn-secondary" onClick={swap}>
            Tukar ↔
          </button>
          <button type="button" className="btn btn-secondary" onClick={randomMatchup}>
            Random Matchup
          </button>
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
            Start Battle
          </button>
        </div>

        <BallPicker
          label="Pemain 2"
          selected={classB}
          other={classA}
          onSelect={(id) => onChange(classA, id)}
        />
      </div>
    </div>
  )
}

interface BallPickerProps {
  label: string
  selected: BallClassId
  other: BallClassId
  onSelect: (id: BallClassId) => void
}

function BallPicker({ label, selected, other, onSelect }: BallPickerProps) {
  return (
    <section className="picker">
      <h2 className="picker-label">{label}</h2>
      <div className="picker-grid">
        {BALL_CLASS_ORDER.map((id) => {
          const def = getBallClass(id)
          const isSelected = id === selected
          const isDisabled = id === other
          return (
            <button
              key={id}
              type="button"
              className={`ball-card${isSelected ? ' is-selected' : ''}`}
              style={{ '--ball-color': def.color, '--ball-stroke': def.strokeColor } as CSSProperties}
              onClick={() => onSelect(id)}
              disabled={isDisabled}
              aria-pressed={isSelected}
            >
              <span className="ball-dot" />
              <span className="ball-card-head">
                <strong>{def.name}</strong>
                <em>{def.role}</em>
              </span>
              <span className="ball-card-desc">{def.description}</span>
              <span className="stat-row">
                <Stat label="HP" value={def.maxHp} />
                <Stat label="ATK" value={def.attack} />
                <Stat label="DEF" value={def.defense} />
                <Stat label="SPD" value={def.speed} />
              </span>
              <span className="skill-note">
                <strong>{def.skillName}</strong> — {def.skillDescription}{' '}
                <em>(Tersedia di Fase 2)</em>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </span>
  )
}
