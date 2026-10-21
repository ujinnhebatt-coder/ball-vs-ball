import { updateAI } from './AIController.ts'
import { getBallClass } from './BallClasses.ts'
import { performBasicAttack, tickAttackCooldown, type BallCombatStats } from './CombatSystem.ts'
import {
  ARENA_HALF_SIZE,
  BALL_RADIUS,
  FIXED_DT,
  LAUNCH_DURATION,
  LAUNCH_SPEED,
  MAX_BATTLE_DURATION,
} from './constants.ts'
import { clampSpeed, collideBalls, collideWithArena, integrate } from './Physics.ts'
import type { Ball, BallClassId, BattlePhase, BattleResult, HudSnapshot } from '../types.ts'

/** Callback yang dipanggil engine saat duel selesai. */
export type BattleEndHandler = (result: BattleResult) => void

/** Efek visual sementara (angka damage, kilatan benturan). */
export interface FloatingText {
  x: number
  y: number
  text: string
  life: number
  maxLife: number
  color: string
}

export interface CollisionSpark {
  x: number
  y: number
  life: number
  maxLife: number
}

export interface EngineOptions {
  classA: BallClassId
  classB: BallClassId
  onBattleEnd?: BattleEndHandler
}

/**
 * Otak duel: memegang state simulasi, menjalankan fixed-timestep update,
 * dan memberi tahu layer UI melalui callback (bukan lewat React state per frame).
 */
export class GameEngine {
  balls: Ball[] = []
  phase: BattlePhase = 'idle'
  /** True saat duel ditahan (pause). */
  paused = false
  elapsed = 0
  arenaHalf = ARENA_HALF_SIZE
  floatingTexts: FloatingText[] = []
  sparks: CollisionSpark[] = []
  stats: Record<number, BallCombatStats> = {}

  private nextId = 1
  private accumulator = 0
  private onBattleEnd?: BattleEndHandler

  constructor(options: EngineOptions) {
    this.onBattleEnd = options.onBattleEnd
    this.reset(options.classA, options.classB)
  }

  /** Menyiapkan duel baru dengan dua kelas yang dipilih. */
  reset(classA: BallClassId, classB: BallClassId): void {
    this.nextId = 1
    this.elapsed = 0
    this.accumulator = 0
    this.phase = 'aim'
    this.paused = false
    this.floatingTexts = []
    this.sparks = []
    this.stats = {}

    // Spawn saling berlawanan di sisi kiri-kanan arena persegi.
    const spawnOffset = this.arenaHalf * 0.75
    this.balls = [
      this.createBall(classA, -spawnOffset, 0),
      this.createBall(classB, spawnOffset, 0),
    ]
    for (const ball of this.balls) {
      this.stats[ball.id] = { damageDealt: 0, damageTaken: 0, attacks: 0, hits: 0 }
    }
    // Arah awal default: masing-masing menghadap lawan.
    this.balls[0].aimAngle = 0
    this.balls[0].facing = 0
    this.balls[1].aimAngle = Math.PI
    this.balls[1].facing = Math.PI
  }

  /** Mengatur arah luncur sebuah bola (radian, 0 = ke kanan). */
  setAimAngle(ballId: number, angle: number): void {
    const ball = this.balls.find((b) => b.id === ballId)
    if (!ball) return
    ball.aimAngle = angle
    ball.facing = angle
  }

  /** Mengatur arah acak untuk kedua bola. */
  randomizeAim(): void {
    for (const ball of this.balls) {
      ball.aimAngle = Math.random() * Math.PI * 2
      ball.facing = ball.aimAngle
    }
  }

  /** Mengganti kelas bola tanpa memulai duel ulang (dipakai Battle Setup). */
  setClasses(classA: BallClassId, classB: BallClassId): void {
    this.reset(classA, classB)
  }

  private createBall(classId: BallClassId, x: number, y: number): Ball {
    const def = getBallClass(classId)
    return {
      id: this.nextId++,
      classId,
      name: def.name,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      hp: def.maxHp,
      maxHp: def.maxHp,
      attack: def.attack,
      defense: def.defense,
      speed: def.speed,
      attackRange: def.attackRange,
      color: def.color,
      strokeColor: def.strokeColor,
      attackCooldown: 0,
      recoverTimer: 0,
      repositionTimer: 0,
      hitFlash: 0,
      aiState: 'idle',
      aimAngle: x < 0 ? 0 : Math.PI,
      launchTimer: 0,
      facing: x < 0 ? 0 : Math.PI,
    }
  }

  /** Melepas bola dengan kecepatan awal sesuai arah yang dipilih pemain. */
  launch(): void {
    if (this.phase !== 'aim') return
    this.phase = 'running'
    this.paused = false
    for (const ball of this.balls) {
      ball.vx = Math.cos(ball.aimAngle) * LAUNCH_SPEED
      ball.vy = Math.sin(ball.aimAngle) * LAUNCH_SPEED
      ball.launchTimer = LAUNCH_DURATION
      ball.aiState = 'launch'
    }
  }

  pause(): void {
    if (this.phase === 'running') this.paused = true
  }

  togglePause(): void {
    if (this.phase !== 'running') return
    this.paused = !this.paused
  }

  get isRunning(): boolean {
    return this.phase === 'running' && !this.paused
  }

  /**
   * Advances simulation by real elapsed time.
   * `speed` > 1 menjalankan lebih banyak timestep per frame.
   */
  update(frameDt: number, speed = 1): void {
    if (this.phase !== 'running' || this.paused) return

    this.accumulator += frameDt * speed
    let steps = 0
    const maxSteps = 8 * Math.ceil(speed) + 4
    while (this.accumulator >= FIXED_DT && steps < maxSteps) {
      this.step(FIXED_DT)
      this.accumulator -= FIXED_DT
      steps += 1
    }
    // Buang sisa waktu agar tidak menumpuk frame setelah lag.
    if (this.accumulator > FIXED_DT * 4) this.accumulator = 0
  }

  /** Satu langkah simulasi fixed timestep. */
  private step(dt: number): void {
    const [a, b] = this.balls
    if (!a || !b) return

    this.elapsed += dt

    // 1) Cooldown & efek status dasar.
    for (const ball of this.balls) {
      tickAttackCooldown(ball, dt)
      if (ball.hitFlash > 0) ball.hitFlash = Math.max(0, ball.hitFlash - dt)
    }

    // 2) AI menentukan gerakan & aksi.
    updateAI(a, b, dt, this.arenaHalf)
    updateAI(b, a, dt, this.arenaHalf)

    // 3) Fisika: integrasi + constraint.
    for (const ball of this.balls) {
      integrate(ball, dt)
      collideWithArena(ball, this.arenaHalf)
      clampSpeed(ball)
    }

    // 4) Tabrakan antar bola.
    if (collideBalls(a, b)) {
      this.sparks.push({
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        life: 0.25,
        maxLife: 0.25,
      })
    }

    // 5) Serangan dasar.
    for (const [attacker, defender] of [
      [a, b],
      [b, a],
    ] as const) {
      const damage = performBasicAttack(attacker, defender, this.stats)
      if (damage > 0) {
        this.floatingTexts.push({
          x: defender.x,
          y: defender.y - defender.radius - 6,
          text: `-${damage}`,
          life: 0.8,
          maxLife: 0.8,
          color: defender.strokeColor,
        })
      }
    }

    // 6) Update efek visual.
    for (const text of this.floatingTexts) {
      text.life -= dt
      text.y -= 26 * dt
    }
    this.floatingTexts = this.floatingTexts.filter((text) => text.life > 0)

    for (const spark of this.sparks) spark.life -= dt
    this.sparks = this.sparks.filter((spark) => spark.life > 0)

    // 7) Cek kondisi selesai.
    if (a.hp <= 0 || b.hp <= 0 || this.elapsed >= MAX_BATTLE_DURATION) {
      this.finish()
    }
  }

  private finish(): void {
    if (this.phase === 'finished') return
    this.phase = 'finished'

    const [a, b] = this.balls
    const aDead = a.hp <= 0
    const bDead = b.hp <= 0
    const winner = aDead && bDead ? null : aDead ? b : a
    const loser = winner ? (winner.id === a.id ? b : a) : null

    const result: BattleResult = {
      winnerId: winner?.id ?? null,
      winnerName: winner?.name ?? null,
      winnerClassId: winner?.classId ?? null,
      winnerColor: winner?.color ?? null,
      loserId: loser?.id ?? null,
      duration: this.elapsed,
      stats: this.balls.map((ball) => ({
        id: ball.id,
        name: ball.name,
        classId: ball.classId,
        color: ball.color,
        damageDealt: this.stats[ball.id]?.damageDealt ?? 0,
        damageTaken: this.stats[ball.id]?.damageTaken ?? 0,
        attacks: this.stats[ball.id]?.attacks ?? 0,
        hits: this.stats[ball.id]?.hits ?? 0,
        hpLeft: ball.hp,
      })),
    }

    this.onBattleEnd?.(result)
  }

  /** Snapshot untuk HUD (dipanggil oleh React secara throttled). */
  getHudSnapshot(): HudSnapshot {
    return {
      phase: this.phase,
      elapsed: this.elapsed,
      balls: this.balls.map((ball) => ({
        id: ball.id,
        name: ball.name,
        classId: ball.classId,
        color: ball.color,
        hp: ball.hp,
        maxHp: ball.maxHp,
        aiState: ball.aiState,
        attackCooldown: ball.attackCooldown,
        attackRange: ball.attackRange,
        aimAngle: ball.aimAngle,
      })),
    }
  }

  get resultDuration(): number {
    return this.elapsed
  }
}
