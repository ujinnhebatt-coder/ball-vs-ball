import { getBallClass } from './BallClasses.ts'
import { MIN_STEER_SPEED } from './constants.ts'
import { distanceToArenaEdge, normalize } from './Physics.ts'
import type { AIState, Ball } from '../types.ts'

/**
 * Finite state machine AI (GDD bagian 8).
 * Fase 1 memakai subset: Idle, Chase, Attack, Recover, Defeated.
 * State Skill akan menyusul di fase 2 bersama implementasi skill.
 */
export function updateAI(
  self: Ball,
  opponent: Ball,
  dt: number,
  arenaRadius: number,
): AIState {
  if (self.hp <= 0) {
    self.aiState = 'defeated'
    return 'defeated'
  }

  const profile = getBallClass(self.classId).ai

  if (self.recoverTimer > 0) {
    self.recoverTimer = Math.max(0, self.recoverTimer - dt)
    self.aiState = 'recover'
    // Sisa-sisa momentum tetap meredup supaya bola bisa kembali bergerak.
    self.vx *= 0.92
    self.vy *= 0.92
    return 'recover'
  }

  const dx = opponent.x - self.x
  const dy = opponent.y - self.y
  const distance = Math.hypot(dx, dy)
  const dir = normalize(dx, dy)
  self.facing = Math.atan2(dy, dx)

  // Kecepatan decay saat tidak ada dorongan AI (damping alami + drag ringan).
  self.vx *= 0.9
  self.vy *= 0.9

  // Hindari dinding berlaku di semua state.
  const edgeDistance = distanceToArenaEdge(self.x, self.y, arenaRadius)
  let wallSteerX = 0
  let wallSteerY = 0
  if (edgeDistance < self.radius * 4) {
    const inward = normalize(-self.x, -self.y)
    const urgency = 1 - edgeDistance / (self.radius * 4)
    wallSteerX = inward.x * urgency * 2.4
    wallSteerY = inward.y * urgency * 2.4
  }

  // 1) Mundur sebentar setelah berhasil mengenai lawan: membuka jarak,
  // lalu mengejar lagi. Membuat ritme duel tidak monoton.
  if (self.repositionTimer > 0) {
    self.repositionTimer = Math.max(0, self.repositionTimer - dt)
    const away = normalize(-dx, -dy)
    const orbitSign = self.id % 2 === 0 ? 1 : -1
    self.vx +=
      (away.x * 1.2 + -away.y * orbitSign * 0.6) * self.speed * profile.steerForce * dt * 3
    self.vy +=
      (away.y * 1.2 + away.x * orbitSign * 0.6) * self.speed * profile.steerForce * dt * 3
    self.vx += wallSteerX * self.speed * dt * 3
    self.vy += wallSteerY * self.speed * dt * 3
    self.aiState = 'chase'
    return 'chase'
  }

  // 2) Reach check -> Attack.
  if (distance <= self.attackRange) {
    self.aiState = 'attack'

    // Orbit: saat dalam jangkauan, bola mengitari lawan (berlawanan arah
    // dengan lawan) alih-alih menempel, supaya duel tidak terlihat diam.
    const orbitSign = self.id % 2 === 0 ? 1 : -1
    const orbitForce = self.speed * 0.9 * profile.steerForce
    self.vx += -dir.y * orbitSign * orbitForce * dt * 3
    self.vy += dir.x * orbitSign * orbitForce * dt * 3

    // Dorong ringan ke arah lawan saat menyerang (lunge kecil).
    self.vx += dir.x * profile.steerForce * 18 * dt
    self.vy += dir.y * profile.steerForce * 18 * dt

    // Jika terlalu berdekatan, menjauh sedikit agar tidak bertumpuk.
    if (distance < self.radius + opponent.radius + 6) {
      self.vx -= dir.x * 60 * dt
      self.vy -= dir.y * 60 * dt
    }

    // Di dekat dinding, koreksi arah agar tetap di dalam arena.
    self.vx += wallSteerX * self.speed * dt * 3
    self.vy += wallSteerY * self.speed * dt * 3
    return 'attack'
  }

  // 3) Di luar jangkauan -> Chase, tapi jaga jarak preferred.
  self.aiState = 'chase'
  const tooClose = distance < profile.preferredRange * 0.7

  // Dorongan menuju / menjauhi lawan.
  const desired =
    tooClose
      ? -1 // mundur
      : Math.min(1, (distance - profile.preferredRange) / profile.preferredRange + 0.35)

  let steerX = dir.x * desired * profile.aggression * profile.steerForce
  let steerY = dir.y * desired * profile.aggression * profile.steerForce
  steerX += wallSteerX
  steerY += wallSteerY

  const steerLength = Math.hypot(steerX, steerY)
  if (steerLength > 0) {
    steerX /= steerLength
    steerY /= steerLength
  }

  // Kecepatan target AI mengikuti speed stat bola.
  const targetSpeed = self.speed * (tooClose ? 0.85 : 1)
  self.vx += steerX * targetSpeed * profile.steerForce * dt * 4
  self.vy += steerY * targetSpeed * profile.steerForce * dt * 4

  // Jaga kecepatan minimum supaya bola tidak diam di tengah arena.
  const speed = Math.hypot(self.vx, self.vy)
  if (speed < MIN_STEER_SPEED) {
    self.vx += steerX * MIN_STEER_SPEED * dt * 6
    self.vy += steerY * MIN_STEER_SPEED * dt * 6
  }

  return 'chase'
}
