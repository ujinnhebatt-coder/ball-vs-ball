Berikut saya susun Game Design Document (GDD) Ball vs Ball: Arena Clash dalam format dokumen yang lebih rapi dan siap dijadikan acuan pengembangan game menggunakan React JS dan HTML5 Canvas.
### GAME DESIGN DOCUMENT
### Ball vs Ball: Arena Clash
![I've Been Building a Multiplayer Physics Arena Game in Godot 4.6 - Games - Godot Forum](https://images.openai.com/static-rsc-4/HCrZykfJUi_WNN9xP8jvaEwviMoRL0vZZzucGTMKzeRXY0APc0wF5tKii2I0HJ_YNbcN4iNZlJGHXWPl6GW_Aq3x7hxTf3djdlZCSXFrqHkTlaahWzoyaEscnVAWOmTz-A8_5cuHdyKB-OGt__BXDIj3DOhh4g-yf5ZP7t4ns_nhGLs4sNWjWrC7x91z05qg?purpose=fullsize)
Nama game
Ball vs Ball: Arena Clash
Versi dokumen
1.0
Genre
2D Auto Battle Arena
Platform
Web Browser
Teknologi
React JS, JavaScript, HTML5 Canvas
Mode utama
1 vs 1 — AI vs AI
Target
Desktop dan mobile
### 1\. High Concept
Ball vs Ball: Arena Clash merupakan game 2D yang mempertemukan dua bola dengan kekuatan berbeda dalam sebuah arena tertutup. Setiap bola memiliki statistik, elemen, kemampuan khusus, dan perilaku AI tersendiri.
Pemain memilih dua bola yang akan bertarung, kemudian menyaksikan duel berlangsung secara otomatis. Pemenang ditentukan berdasarkan kemampuan bertahan, menyerang, memanfaatkan skill, serta interaksi fisika di arena.
Konsep inti: dua bola, satu arena, kekuatan berbeda, dan hanya satu pemenang.
### 2\. Game Objectives
Tujuan pengembangan game ini adalah:
* Membuat permainan auto battle yang mudah dipahami.
* Memberikan identitas unik kepada setiap jenis bola.
* Menghasilkan pertarungan yang menarik melalui AI dan fisika.
* Menyediakan sistem pemilihan bola dan pertandingan ulang.
* Membuat game ringan yang dapat dijalankan melalui browser tanpa instalasi.
### 3\. Target Audience
* Pemain kasual yang menyukai permainan arena.
* Penggemar simulasi pertarungan otomatis.
* Pemain yang tertarik membandingkan kemampuan karakter.
* Pengguna desktop dan ponsel yang ingin memainkan game melalui browser.
### 4\. Core Gameplay
Pemain tidak mengendalikan gerakan bola secara langsung. Setelah pertandingan dimulai, AI mengatur pergerakan, serangan, penggunaan skill, dan respons terhadap lawan.
01
Pilih Bola
Pilih dua kelas bola dengan kemampuan berbeda.
02
Mulai Duel
Kedua bola muncul di arena.
03
Auto Battle
AI mengejar, menyerang, menghindar, dan memakai skill.
04
Hasil Pertandingan
Satu bola menang ketika HP lawan habis.
05
Rematch
Ulangi duel atau pilih kombinasi bola baru.
### 5\. Arena Design
![Save 50% on Hyper Shapes on Steam](https://images.openai.com/static-rsc-4/E07FUhExZlXnknXezajKpCJfu1DPCd0T-Wb2sptf7xyKSLehBZAm_PK-1sAH2N0lAnoF0e-Ku8SwoIx9JEGaaowvR2OO7zBD_K5ia8FeLPW-zrBpEBempjQsA8Wkaxoi2NPSveycwX2aWVjHA-AMtkNeyKNCjhy8kM1-PGxNgp2lKN_FBx4indtDe1l0OTlz?purpose=fullsize)
Arena menggunakan tampilan 2D dari atas (top-down view).
| Elemen          | Spesifikasi                   || --------------- | ----------------------------- || Bentuk          | Lingkaran                     || Ukuran awal     | 800 × 800 unit virtual        || Batas arena     | Dinding yang memantulkan bola || Jumlah petarung | 2 bola                        || Titik spawn     | Saling berlawanan             || Hazard          | Tidak ada pada MVP            || Kamera          | Tetap, mengikuti arena        |
Arena harus memiliki batas yang jelas agar bola tidak keluar dari area pertarungan. Efek visual dapat berupa garis neon, lingkaran energi, dan partikel benturan.
### 6\. Ball Classes
Versi awal menyediakan empat kelas bola.
![Vector illustration of a glowing magical fire sphere.](https://images.openai.com/static-rsc-4/oieec5NXA_ldRyFZwr0-209b7Hx1tdcTEEE8j_ZHv_Wnp5z8IO2zZ-GB9q_E6MnFV8Th7Ln26lHR2ZppjdqjbT6yhSRgIq3giboqzpBeYsdGCCW2Ik0RGL9P94eDq_fF982s3tCLZ3yARQ0klIIr1QYDiTVWX9dvhesqxLG5yBhPkJxJ5UULmPK7XA3sNET6?purpose=fullsize)
Fire Ball
* Peran: penyerang.
* Skill: Fire Burst.
* Efek: ledakan area dan knockback.
* Kelemahan: pertahanan rendah.
![Everfrost Orb (very rare) - Timmmi's Treasure Vault](https://images.openai.com/static-rsc-4/qqMvSV5rTK8qcPL5lQvG_Mpc-kGzAtbAYtTVqU1sJAcnzK_cBvzeT8UQH_9ma1yE98gi6m42q8gMraIYXDsE74bxRpl-syprutU9rKLx2xNqo6jryxYuMl8qmlS4ctlXT8MtQwhAT2JLEdNoSJN_Bqko5qw5PY0H1-goWanv3gmfolLCBbPU0WMvwyf8rO6J?purpose=fullsize)
Ice Ball
* Peran: pengendali.
* Skill: Frost Pulse.
* Efek: memperlambat lawan.
* Kelemahan: serangan dasar lebih lemah.
![Light energy ball. Glowing golden power sphere with electric lightning effect on black background. Futuristic plasma ball, magic orb, game portal. Abstract vector illustration](https://images.openai.com/static-rsc-4/X6qmTs1eeYIsgZQESlWu0_94bBc8RuWvgKbOMYyxyiMjCzvcZPJz6Pm47tVjNu-NzqIiAhQIQoDeMhhpRxG3kczFWBC-cs0Rziru2yLXqvwp_gxo6FhDszjn1uGsGcM5_XtUBpg11u7P3NTAsFbjulO90rhRoomVYcTtdxXWv_p7Rgs5PmikiFLJkyRDJVlx?purpose=fullsize)
Thunder Ball
* Peran: mobilitas tinggi.
* Skill: Thunder Dash.
* Efek: dash cepat dan damage kontak.
* Kelemahan: HP rendah.
![Stylized Textures - Vol 44 - Foliage](https://images.openai.com/static-rsc-4/RPdDavExwZ_7PorTSNq2PxO8Hfk0bQ3AQnGetLqzY0mBVHwC3BKwI7MKV04ZgJEKvHwSQhq_4x3epYkRuw4BjDHAlFHaPre03Xu-MsMQhJEhRXkAG8L00HIPNmp7Emj3UYHymmpsbJlExMFddBTv59pja14XVjseHwJcDpxZtrydMeSMMe3q39o-iOtotUYF?purpose=fullsize)
Nature Ball
* Peran: bertahan.
* Skill: Regeneration.
* Efek: memulihkan 15 HP.
* Kelemahan: damage dasar rendah.
### Statistik awal
| Statistik    | Fire | Ice | Thunder | Nature || ------------ | ---- | --- | ------- | ------ || HP           | 100  | 110 | 85      | 120    || Attack       | 12   | 9   | 10      | 8      || Defense      | 1    | 3   | 1       | 4      || Speed        | 120  | 100 | 155     | 90     || Attack range | 80   | 80  | 80      | 80     |
Semua angka merupakan nilai awal untuk pengujian. Statistik akhir ditentukan melalui playtesting dan balancing.
### 7\. Combat System
### Serangan dasar
* Bola menyerang ketika lawan berada dalam jangkauan.
* Serangan hanya dapat dilakukan jika cooldown selesai.
* Serangan menghasilkan damage dan efek benturan.
* HP tidak boleh turun di bawah nol.
Rumus damage:
D=\\max(1,A-R)
Keterangan: adalah damage akhir, adalah attack, dan adalah defense.
### Skill khusus
| Skill        | Efek                      | Cooldown awal || ------------ | ------------------------- | ------------- || Fire Burst   | Damage area dan knockback | 8 detik       || Frost Pulse  | Slow selama 2 detik       | 8 detik       || Thunder Dash | Dash dan damage kontak    | 7 detik       || Regeneration | Memulihkan 15 HP          | 10 detik      |
Skill harus mempunyai indikator visual, durasi efek yang jelas, dan aturan aktivasi agar tidak digunakan berulang kali dalam satu frame.
### Collision System
Collision digunakan untuk mendeteksi:
* Bola bertabrakan dengan bola lain.
* Bola menyentuh dinding arena.
* Proyektil mengenai target.
* Serangan menghasilkan knockback.
Bola tidak boleh menembus dinding atau terus bertumpuk dengan bola lawan akibat tabrakan.
### 8\. AI System
AI mengatur perilaku kedua bola menggunakan finite state machine.
| State    | Perilaku                                  || -------- | ----------------------------------------- || Idle     | Menunggu pertandingan dimulai             || Chase    | Bergerak mendekati lawan                  || Attack   | Menyerang saat target terjangkau          || Skill    | Mengaktifkan kemampuan khusus             || Recover  | Menstabilkan gerakan setelah terkena efek || Defeated | Menghentikan seluruh aksi                 |
AI dievaluasi setiap pembaruan simulasi. Setiap kelas dapat mempunyai prioritas berbeda, misalnya Thunder lebih agresif mengejar lawan, sedangkan Nature lebih mengutamakan bertahan.
### 9\. Game UI
![Fury Arena](https://images.openai.com/static-rsc-4/Gyz_eSuaSXJgQ5f6Qwq2NWrPMnkB3BXK5lesQBAs5Y5eOt2hvKL4dBzge1jKSEIlo_ah1pTrepJ86Z7ZD1EkSE32rVwySRNvp8dmragLi26n-LiYDXrQgpbI_aO5BZEvE_2cQkgFyiyv4pN_qUU0mSmVbhMTecqXAaNYiDgA5VVcO8s79vclB2ytgJdI4LiL?purpose=fullsize)
Main Menu
* Play
* How to Play
* Settings
![Dark Stones Download Latest Android APK - Free - gamespot](https://images.openai.com/static-rsc-4/2osmWKvc0n-R_thfnOCWmC_EYEldnXCq6hlOg7Jp1jT89ytWOVBHYQF0ePzUo2T-q0icqiLcRckDYvbklzprGK7XswqcQyl4U2uRi6w9OTynLZsFyiA8QjMe_p5_AKelremsLw3w-ApF2JaOc1rMT9BiDIUMpuvwoRd_znvqh6DW1zzvRSMbElIl--goaBbJ?purpose=fullsize)
Battle Setup
* Pilihan dua bola.
* Statistik dan deskripsi skill.
* Start Battle dan Random Matchup.
![Realm of Balls — cena 315 EUR, vyšla 7. června 2026 | KalendářHráče.cz](https://images.openai.com/static-rsc-4/7sKSNfhMXd2r6GmzMibC80ZVVDqFxCScDd8xPpvnQ57zjfotI56Vkb7-aUxs37zc09aTA3ev49GJYMBUUF3sYRxRsBZ0qNct3SPQW2HDDYx_VNmplFRL_B0vilwKzn9gRFIdUbKhXO4fxU_OFGpWU9CL2DjgahWiAABC3Ixh6navKBmQp1clfEVfeJhRajfw?purpose=fullsize)
Battle Screen
* Arena Canvas.
* Bar HP dan timer.
* Indikator skill.
* Pause, restart, dan kecepatan simulasi.
![Super Block Crush on Steam](https://images.openai.com/static-rsc-4/LJmoBlQjmTpg8jl0oEC32ataS7gWLrdJEg6QKXagWg4BikxAtRygIPtY_up4Ds4ciNB1jpsKUvj9f3n6pwLos9OA35-OM-XMPkkIX4yDbmQOVongyObLtzRk5ONz5P1BY6b8fJ3g-Kzxna6BchpDkLSihrnbC7tBqup3TVUeH8VBe2VofX2RzkEPv4uAPnRu?purpose=fullsize)
Result Screen
* Pemenang.
* Durasi dan statistik duel.
* Rematch dan Change Balls.
### 10\. Teknologi dan Arsitektur
| Teknologi            | Fungsi                       || -------------------- | ---------------------------- || React JS             | UI dan navigasi              || HTML5 Canvas         | Rendering arena dan bola     || JavaScript           | Logika permainan dan AI      || Matter.js (opsional) | Fisika dan collision         || CSS                  | Styling dan layout responsif || Vite                 | Development server dan build |
### Struktur folder
```textsrc/├── components/│   ├── MainMenu.jsx│   ├── BattleSetup.jsx│   ├── BattleHUD.jsx│   └── ResultScreen.jsx├── game/│   ├── GameEngine.js│   ├── Renderer.js│   ├── Physics.js│   ├── AIController.js│   ├── CombatSystem.js│   └── BallClasses.js├── hooks/│   └── useGameEngine.js├── App.jsx└── main.jsx```
Game loop menggunakan `requestAnimationFrame`. Canvas menggambar setiap frame, sementara React memperbarui UI ketika informasi penting berubah, seperti HP, timer, dan hasil pertandingan.
### 11\. Audio dan Visual Effects
* Efek api untuk Fire Ball.
* Efek kristal es untuk Ice Ball.
* Trail listrik untuk Thunder Ball.
* Partikel penyembuhan untuk Nature Ball.
* Efek flash ketika menerima damage.
* Efek knockback ketika terjadi benturan.
* Audio serangan, skill, kemenangan, dan kekalahan.
Efek visual harus ringan agar game tetap lancar di browser mobile.
### 12\. Game Flow
```mermaid
flowchart TD    A[Main Menu] --> B[Battle Setup]    B --> C[Initialize Arena]    C --> D[Start Auto Battle]    D --> E[Update AI and Physics]    E --> F{Battle Finished?}    F -- No --> E    F -- Yes --> G[Show Result]    G --> H{Rematch?}    H -- Yes --> C    H -- No --> A```
### 13\. MVP dan Roadmap
MVP — Prototype
Arena, dua bola, gerakan AI, collision, HP, dan serangan dasar.
Combat Update
Cooldown, skill, knockback, efek status, dan hasil duel.
UI Update
Menu utama, pemilihan bola, HUD, dan layar hasil.
Polishing
Audio, animasi, balancing, responsivitas, dan pengujian browser.
### Kriteria keberhasilan
* Dua bola dapat bertarung otomatis hingga duel selesai.
* Setiap kelas memiliki statistik dan skill yang berbeda.
* Tidak terjadi serangan berulang akibat bug cooldown.
* Kondisi kemenangan dan kekalahan berjalan benar.
* Tombol restart dan rematch berfungsi.
* Game berjalan baik pada desktop dan browser mobile.
### 14\. Fitur di luar versi pertama
Fitur berikut dapat ditambahkan setelah MVP stabil:
* Lebih banyak kelas bola.
* Arena dengan jebakan.
* Sistem level dan upgrade.
* Turnamen otomatis.
* Statistik kemenangan setiap bola.
* Mode spectator dan replay.
* Multiplayer online.
### 15\. Kesimpulan
Ball vs Ball: Arena Clash dirancang sebagai game web 2D yang berfokus pada pertarungan otomatis antara dua bola dengan kemampuan berbeda. Kombinasi AI, fisika, skill khusus, dan desain arena menjadi fondasi gameplay.
Prioritas pengembangan adalah membuat prototipe dua bola yang dapat bertarung otomatis, kemudian menambahkan sistem kelas, UI, efek visual, dan fitur lanjutan secara bertahap.