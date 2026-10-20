interface MainMenuProps {
  onPlay: () => void
  onHowToPlay: () => void
}

/** Layar Main Menu (GDD bagian 9). */
export function MainMenu({ onPlay, onHowToPlay }: MainMenuProps) {
  return (
    <div className="screen menu-screen">
      <div className="menu-panel">
        <span className="menu-eyebrow">Arena Duel Otomatis</span>
        <h1 className="menu-title">
          Ball <span className="menu-vs">vs</span> Ball
        </h1>
        <p className="menu-subtitle">Arena Clash</p>
        <p className="menu-desc">
          Pilih dua bola dengan stat dan karakter berbeda, lalu saksikan AI bertarung
          otomatis di arena tertutup. Hanya satu pemenang.
        </p>
        <div className="menu-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={onPlay}>
            Play
          </button>
          <button type="button" className="btn btn-secondary" onClick={onHowToPlay}>
            How to Play
          </button>
        </div>
      </div>
    </div>
  )
}
