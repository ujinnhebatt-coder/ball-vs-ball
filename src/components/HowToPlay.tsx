interface HowToPlayProps {
  onBack: () => void
}

/** Layar penjelasan singkat (bagian How to Play pada GDD bagian 9). */
export function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="screen menu-screen">
      <div className="menu-panel menu-panel-wide">
        <h1 className="screen-title">How to Play</h1>
        <ol className="howto-list">
          <li>
            <strong>Pilih dua bola.</strong> Tiap kelas punya HP, Attack, Defense, dan Speed
            berbeda.
          </li>
          <li>
            <strong>Battle dimulai otomatis.</strong> AI mengejar, menyerang, dan menghindar
            sendiri — kamu hanya menonton.
          </li>
          <li>
            <strong>Serangan dasar.</strong> Saat lawan masuk jangkauan, bola menyerang dengan
            damage <code>max(1, Attack − Defense)</code> setelah cooldown selesai.
          </li>
          <li>
            <strong>Tabruran fisik.</strong> Kedua bola memantul di dinding arena dan saling
            dorong saat bertemu.
          </li>
          <li>
            <strong>Menang.</strong> Duel berakhir saat HP salah satu bola habis.
          </li>
        </ol>
        <p className="howto-note">
          Kemampuan khusus tiap bola (Fire Burst, Frost Pulse, Thunder Dash, Regeneration)
          akan hadir di Fase 2.
        </p>
        <button type="button" className="btn btn-primary" onClick={onBack}>
          Kembali
        </button>
      </div>
    </div>
  )
}
