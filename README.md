# Ball vs Ball: Arena Clash

Game 2D auto-battle arena berbasis web. Dua bola dengan statistik, elemen, dan
perilaku AI berbeda bertarung otomatis di arena tertutup. Kedua pemain dikendalikan
AI — pemain hanya memilih kombinasi bola lalu menonton duel berlangsung.

Dibangun mengikuti Game Design Document (`GDD.md`) Fase 1: prototype arena, dua bola,
perilaku AI, collision, HP, dan serangan dasar.

## Stack

- React 19 + TypeScript
- Vite 8 (dev server & build)
- HTML5 Canvas 2D untuk rendering arena
- Fisika kustom (tidak memakai library fisika eksternal)

## Menjalankan

```bash
npm install
npm run dev        # dev server di http://localhost:5173
npm run build      # typecheck + build produksi ke dist/
npm run preview    # preview hasil build
npm run simulate   # uji duel headless (12 kombinasi kelas)
```

## Tautan

- **Live (public):** https://htmlpreview.github.io/?https://raw.githubusercontent.com/ujinnhebatt-coder/ball-vs-ball/gh-pages/index.html
- **GitHub Pages (resmi):** https://ujinnhebatt-coder.github.io/ball-vs-ball/
 Aktifkan dulu di `Settings → Pages → Build and deployment → Source: GitHub Actions`;
  workflow `.github/workflows/deploy.yml` lalu ter-deploy otomatis.
- Build statis tersedia di branch `gh-pages`.

## Struktur

```text
src/
├── components/   # MainMenu, BattleSetup, BattleScreen, BattleHUD, ResultOverlay, HowToPlay
├── game/         # GameEngine, Renderer, Physics, AIController, CombatSystem, BallClasses
├── hooks/        # useGameEngine (game loop + HUD throttled)
├── App.tsx
└── main.tsx
scripts/
└── simulate.ts   # simulasi duel tanpa browser untuk cek balancing
```

## Aturan duel (Fase 1)

- Damage serangan dasar: `max(1, Attack − Defense)`, cooldown 1 detik.
- Arena persegi 800 × 800 unit; bola terpantul di dinding dan saling dorong saat bertabrakan.
- AI memakai finite state machine: `Idle → Launch → Chase → Attack → Recover → Defeated`,
  dengan profil perilaku berbeda per kelas (agresivitas, jarak preferred, waktu recover).
- Duel berakhir ketika HP salah satu bola habis.

## Tentukan arah sebelum duel

Sebelum duel dimulai, arena tampil dalam fase **aim**:

1. Setiap bola punya panah arah yang bisa diseret (klik bola juga bisa langsung mengarahkannya).
2. Sudut terpilih tampil di canvas dan di panel HUD.
3. Tombol **Acak Arah** mengacak arah kedua bola.
4. **Mulai Duel** melepas bola: masing-masing meluncur 1,5 detik ke arah yang dipilih
   (state `Launch`) sebelum AI mengambil alih kendali.

## Visual

Rendering memakai Canvas 2D murni: bola digambar dengan gradasi 3D, specular
highlight, rim light, dan bayangan jatuh; lantai arena memakai tekstur noise,
grid, dan vignette; dinding memiliki kedalaman lewat inner shadow dan drop shadow.

## Kemampuan khusus

Fire Burst, Frost Pulse, Thunder Dash, dan Regeneration sudah tercantum di UI namun
belum diimplementasikan — dijadwalkan pada Fase 2 (Combat Update).
