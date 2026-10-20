import {
  ARENA_RADIUS,
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
 * Benturan bola dengan dinding arena lingkaran.
 * Memantulkan velocity dan menaruh bola tepat di dalam batas (tidak menembus).
 */
export function collideWithArena(ball: Ball, arenaRadius: number = ARENA_RADIUS): boolean {
  const dist = Math.hypot(ball.x, ball.y)
  const limit = arenaRadius - ball.radius
  if (dist <= limit) return false

  const normal = normalize(ball.x, ball.y)
  // Dorong bola keluar dari dinding (posisi dipatok ke radius limit).
  ball.x = normal.x * limit
  ball.y = normal.y * limit

  // Hanya pantulkan jika bola bergerak ke arah keluar.
  const outward = ball.vx * normal.x + ball.vy * normal.y
  if (outward > 0) {
    const vx = ball.vx - (1 + WALL_RESTITUTION) * outward * normal.x
    const vy = ball.vy - (1 + WALL_RESTITUTION) * outward * normal.y
    ball.vx = vx
    ball.vy = vy
  }
  return true
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

/** Mengembalikan true jika titik berada di dalam arena (untuk AI menjauh dari dinding). */
export function distanceToArenaEdge(
  x: number,
  y: number,
  arenaRadius: number = ARENA_RADIUS,
): number {
  return arenaRadius - Math.hypot(x, y)
}
