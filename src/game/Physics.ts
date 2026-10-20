import {
  ARENA_HALF_SIZE,
  BALL_RESTITUTION,
  LINEAR_DAMPING,
  MAX_COLLISION_SPEED,
  MAX_SPEED,
  MIN_SEPARATION,
  WALL_RESTITUTION,
} from './constants.ts'
import type { Ball } from '../types.ts'

/** Vektor 2D sederhana. */
export interface Vec2 {
  x: number
  y: number
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

export function length(x: number, y: number): number {
  return Math.hypot(x, y)
}

/** Menormalisasi vektor; mengembalikan {0,0} bila panjangnya nol. */
export function normalize(x: number, y: number): Vec2 {
  const len = Math.hypot(x, y)
  if (len < 1e-6) return { x: 0, y: 0 }
  return { x: x / len, y: y / len }
}

/** Mengatur kecepatan bola dengan batas maksimum. */
export function clampSpeed(ball: Ball): void {
  const speed = Math.hypot(ball.vx, ball.vy)
  if (speed > MAX_SPEED) {
    const scale = MAX_SPEED / speed
    ball.vx *= scale
    ball.vy *= scale
  }
}

/**
 * Integrasi posisi bola + damping (gesekan).
 * Damping diterapkan per detik, bukan per frame, agar konsisten antar kecepatan simulasi.
 */
export function integrate(ball: Ball, dt: number): void {
  const damping = Math.exp(-LINEAR_DAMPING * dt)
  ball.vx *= damping
  ball.vy *= damping
  ball.x += ball.vx * dt
  ball.y += ball.vy * dt
}

/**
 * Benturan bola dengan dinding arena persegi.
 * Memantulkan velocity per sumbu dan menaruh bola tepat di dalam batas
 * (tidak menembus dinding, termasuk di sudut).
 */
export function collideWithArena(ball: Ball, arenaHalf: number = ARENA_HALF_SIZE): boolean {
  const limit = arenaHalf - ball.radius
  let collided = false

  // Dinding kiri & kanan.
  if (ball.x < -limit) {
    ball.x = -limit
    if (ball.vx < 0) ball.vx = -ball.vx * WALL_RESTITUTION
    collided = true
  } else if (ball.x > limit) {
    ball.x = limit
    if (ball.vx > 0) ball.vx = -ball.vx * WALL_RESTITUTION
    collided = true
  }

  // Dinding atas & bawah.
  if (ball.y < -limit) {
    ball.y = -limit
    if (ball.vy < 0) ball.vy = -ball.vy * WALL_RESTITUTION
    collided = true
  } else if (ball.y > limit) {
    ball.y = limit
    if (ball.vy > 0) ball.vy = -ball.vy * WALL_RESTITUTION
    collided = true
  }

  return collided
}

/**
 * Benturan antar bola: separasi posisi + tukar velocity sepanjang normal.
 * Menghasilkan efek "benturan" (knockback) secara otomatis.
 */
export function collideBalls(a: Ball, b: Ball): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const distSq = dx * dx + dy * dy
  const minDist = a.radius + b.radius
  if (distSq >= minDist * minDist) return false

  const dist = Math.sqrt(distSq)
  // Normal acak-ish tapi deterministik bila kedua bola overlap sempurna.
  const nx = dist > MIN_SEPARATION ? dx / dist : 1
  const ny = dist > MIN_SEPARATION ? dy / dist : 0

  const overlap = minDist - dist
  // Bagi separasi rata antara dua bola.
  a.x -= (nx * overlap) / 2
  a.y -= (ny * overlap) / 2
  b.x += (nx * overlap) / 2
  b.y += (ny * overlap) / 2

  // Relativistic-lite: tukar komponen velocity sepanjang normal.
  const relVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
  if (relVel > 0) return false // sedang menjauh

  const impulse = (-(1 + BALL_RESTITUTION) * relVel) / 2
  a.vx -= impulse * nx
  a.vy -= impulse * ny
  b.vx += impulse * nx
  b.vy += impulse * ny

  // Batasi kecepatan setelah benturan agar tetap terkendali.
  const speed = Math.hypot(a.vx, a.vy)
  if (speed > MAX_COLLISION_SPEED) {
    a.vx = (a.vx / speed) * MAX_COLLISION_SPEED
    a.vy = (a.vy / speed) * MAX_COLLISION_SPEED
  }
  const speedB = Math.hypot(b.vx, b.vy)
  if (speedB > MAX_COLLISION_SPEED) {
    b.vx = (b.vx / speedB) * MAX_COLLISION_SPEED
    b.vy = (b.vy / speedB) * MAX_COLLISION_SPEED
  }
  return true
}

/** Jarak bola ke dinding arena terdekat (untuk AI menghindari dinding). */
export function distanceToArenaEdge(
  x: number,
  y: number,
  arenaHalf: number = ARENA_HALF_SIZE,
): number {
  return Math.min(arenaHalf - Math.abs(x), arenaHalf - Math.abs(y))
}

/**
 * Menggerakkan velocity bola mendekati velocity target dengan batas
 * percepatan/perlambatan (model "seek"), sehingga gerak AIhalus dan
 * kecepatan akhirnya persis mengikuti stat Speed.
 */
export function seekVelocity(
  ball: Ball,
  targetVx: number,
  targetVy: number,
  dt: number,
  acceleration: number,
  deceleration: number,
): void {
  const dvx = targetVx - ball.vx
  const dvy = targetVy - ball.vy
  const distance = Math.hypot(dvx, dvy)
  if (distance < 1e-6) return

  // Akselerasi saat mengejar, perlambatan saat melambat.
  const currentSpeed = Math.hypot(ball.vx, ball.vy)
  const targetSpeed = Math.hypot(targetVx, targetVy)
  const rate = targetSpeed > currentSpeed ? acceleration : deceleration

  const maxStep = rate * dt
  const scale = Math.min(1, maxStep / distance)
  ball.vx += dvx * scale
  ball.vy += dvy * scale
}
