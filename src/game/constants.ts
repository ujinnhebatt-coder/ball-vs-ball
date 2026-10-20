/**
 * Semua angka tunable game ada di sini agar easy balancing.
 * Nilai awal diambil dari GDD bagian 5, 6, dan 7.
 */

/** Fixed timestep simulasi (detik). */
export const FIXED_DT = 1 / 60

/** Durasi maksimum satu frame simulasi agar tidak "time jump" setelah tab switch. */
export const MAX_FRAME_DT = 0.25

/** Radius arena lingkaran (unit virtual). GDD: bentuk arena = lingkaran. */
export const ARENA_RADIUS = 400

/** Radius tiap bola (unit). */
export const BALL_RADIUS = 20

/** Gesekan/damping velocity per detik (0..1). */
export const LINEAR_DAMPING = 1.6

/** Restitusi benturan dengan dinding arena. */
export const WALL_RESTITUTION = 0.85

/** Restitusi benturan antar bola. */
export const BALL_RESTITUTION = 0.9

/** Sisa energi kecepatan maksimum setelah tabrakan bola. */
export const MAX_COLLISION_SPEED = 260

/** Cooldown serangan dasar (detik). */
export const BASIC_ATTACK_COOLDOWN = 1.0

/** Cooldown lanjutan serangan dasar setelah dipicu (detik) — mencegah double trigger dalam satu frame. */
export const ATTACK_REARM = 0.05

/** Durasi efek flash saat terkena damage (detik). */
export const HIT_FLASH_DURATION = 0.18

/** Kecepatan minimum agar bola dianggap "bergerak" oleh AI. */
export const MIN_STEER_SPEED = 12

/** Jarak minimum antar bola agar tidak saling menumpuk. */
export const MIN_SEPARATION = 0.01

/** Batas kecepatan maksimum bola (unit/detik) — mencegah runaway velocity. */
export const MAX_SPEED = 420

/** Durasi maksimum duel sebelum dianggap timeout (detik). */
export const MAX_BATTLE_DURATION = 120

/** Jumlah pixel fallback untuk rasio DPR. */
export const MAX_DPR = 2
