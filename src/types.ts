/**
 * Shared type definitions for Ball vs Ball: Arena Clash.
 */

/** Identitas tiap kelas bola yang tersedia. */
export type BallClassId = 'fire' | 'ice' | 'thunder' | 'nature'

/** State machine AI sesuai GDD bagian 8. */
export type AIState = 'idle' | 'chase' | 'attack' | 'recover' | 'defeated'

/** Fase Puesanan yang sedang berjalan. */
export type BattlePhase = 'idle' | 'running' | 'finished'

/** Profil perilaku AI per kelas (GDD: tiap kelas punya prioritas berbeda). */
export interface AIProfile {
  /** Jarak Preferred dari lawan (unit). Bola cenderung menjaga jarak ini. */
  preferredRange: number
  /** Seberapa agresif bola mengejar lawan (0..1). */
  aggression: number
  /** Durasi istirahat bola setelah terkena serangan (detik). */
  recoverDuration: number
  /** Kekuatan dorongan arah (steer) yang diberikan AI. */
  steerForce: number
}

/** Data statis sebuah kelas bola (GDD bagian 6). */
export interface BallClassDef {
  id: BallClassId
  name: string
  role: string
  description: string
  /** Nama skill khusus (implementasi penuh datang di fase 2). */
  skillName: string
  skillDescription: string
  maxHp: number
  attack: number
  defense: number
  /** Kecepatan dasar dalam unit/detik. */
  speed: number
  /** Jangkauan serangan dasar dalam unit. */
  attackRange: number
  /** Warna utama (gaya flat). */
  color: string
  /** Warna stroke yang lebih gelap. */
  strokeColor: string
  ai: AIProfile
}

/** Instansi bola yang sedang bertarung. */
export interface Ball {
  id: number
  classId: BallClassId
  name: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  attackRange: number
  color: string
  strokeColor: string
  /** Sisa cooldown serangan dasar (detik). */
  attackCooldown: number
  /** Sisa durasi state Recover (detik). */
  recoverTimer: number
  /** Sisa durasi mundur singkat setelah successfully land a hit (detik). */
  repositionTimer: number
  /** Sisa efek flash saat terkena damage (detik). */
  hitFlash: number
  aiState: AIState
  /** Arah kibasan/serangan terakhir, dipakai renderer. */
  facing: number
}

/** Snapshot HUD yang dikirim ke React (di-throttle, bukan per frame). */
export interface HudSnapshot {
  phase: BattlePhase
  elapsed: number
  balls: Array<{
    id: number
    name: string
    classId: BallClassId
    color: string
    hp: number
    maxHp: number
    aiState: AIState
    attackCooldown: number
    attackRange: number
  }>
}

/** Hasil duel. */
export interface BattleResult {
  winnerId: number | null
  winnerName: string | null
  winnerClassId: BallClassId | null
  winnerColor: string | null
  loserId: number | null
  duration: number
  stats: Array<{
    id: number
    name: string
    classId: BallClassId
    color: string
    damageDealt: number
    damageTaken: number
    attacks: number
    hits: number
    hpLeft: number
  }>
}
