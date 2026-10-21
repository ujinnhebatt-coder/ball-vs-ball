import { getBallClass } from './BallClasses.ts'
import { AI_ACCELERATION, AI_DECELERATION, MIN_STEER_SPEED } from './constants.ts'
import { distanceToArenaEdge, normalize, seekVelocity } from './Physics.ts'
import type { AIState, Ball } from '../types.ts'

/**
 * Finite state machine AI (GDD bagian 8).
 * Fase 1 memakai subset: Idle, Chase, Attack, Recover, Defeated.
 * State Skill akan menyusul di fase 2 bersama implementasi skill.
 *
 * Model gerak: "seek" — bola selalu menyeberangi velocity target
 * (arah × stat Speed) dengan percepatan terbatas. Efeknya kecepatan bola
 * sesuai stat, gerakan halus, dan momentum knockback tetap terlihat.
 */
export function updateAI(
  self: Ball,
  opponent: Ball,
  dt: number,
  arenaHalf: number,
): AIState {
  if (self.hp <= 0) {
    self.aiState = 'defeated'
    return 'defeated'
  }

  const profile = getBallClass(self.classId).ai

  // Fase luncur: bola meluncur bebas ke arah yang dipilih pemain,
  // AI belum mengambil alih kendali.
  if (self.launchTimer > 0) {
    self.launchTimer = Math.max(0, self.launchTimer - dt)
    self.aiState = 'launch'
    self.facing = self.aimAngle
    return 'launch'
  }

  if (self.recoverTimer > 0) {
    self.recoverTimer = Math.max(0, self.recoverTimer - dt)
    self.aiState = 'recover'
    // Tidak ada steering sama sekali: momentum knockback meredup secara
    // natural lewat damping, bukan dipaksa melambat. Dengan begitu
    // pantulan benturan terasa nyata.
    return 'recover'
  }

  const dx = opponent.x - self.x
  const dy = opponent.y - self.y
  const distance = Math.hypot(dx, dy)
  const dir = normalize(dx, dy)
  self.facing = Math.atan2(dy, dx)

  // Hindari dinding berlaku di semua state (arah ke tengah arena).
  const edgeDistance = distanceToArenaEdge(self.x, self.y, arenaHalf)
  let wallSteerX = 0
  let wallSteerY = 0
  // Penghindaran dinding sengaja ringan: bola boleh memakai seluruh arena
  // dan memantul di dinding, bukan terkurung di tengah.
  if (edgeDistance < self.radius * 2) {
    const inward = normalize(-self.x, -self.y)
    const urgency = 1 - edgeDistance / (self.radius * 2)
    wallSteerX = inward.x * urgency * 1.0
    wallSteerY = inward.y * urgency * 1.0
  }

  // 1) Mundur sebentar setelah berhasil mengenai lawan: membuka jarak,
  // lalu mengejar lagi. Membuat ritme duel tidak monoton.
  if (self.repositionTimer > 0) {
    self.repositionTimer = Math.max(0, self.repositionTimer - dt)
    const away = normalize(-dx, -dy)
    const orbitSign = self.id % 2 === 0 ? 1 : -1
    let steerX = away.x * 1.2 + -away.y * orbitSign * 0.6
    let steerY = away.y * 1.2 + away.x * orbitSign * 0.6
    const steerLength = Math.hypot(steerX, steerY) || 1
    steerX /= steerLength
    steerY /= steerLength

    steerX += wallSteerX
    steerY += wallSteerY
    const steerLen2 = Math.hypot(steerX, steerY) || 1
    seekVelocity(
      self,
      (steerX / steerLen2) * self.speed * 1.1,
      (steerY / steerLen2) * self.speed * 1.1,
      dt,
      AI_ACCELERATION,
      AI_DECELERATION,
    )
    self.aiState = 'chase'
    return 'chase'
  }

  // 2) Reach check -> Attack.
  if (distance <= self.attackRange) {
    self.aiState = 'attack'

    // Orbit: saat dalam jangkauan, bola mengitari lawan (berlawanan arah
    // dengan lawan) alih-alih menempel, supaya duel tidak terlihat diam.
    const orbitSign = self.id % 2 === 0 ? 1 : -1
    const orbitSpeed = self.speed * 0.9 * profile.steerForce
    let targetVx = -dir.y * orbitSign * orbitSpeed + dir.x * 40
    let targetVy = dir.x * orbitSign * orbitSpeed + dir.y * 40

    // Jika terlalu berdekatan, menjauh sedikit agar tidak bertumpuk.
    if (distance < self.radius + opponent.radius + 6) {
      targetVx -= dir.x * 90
      targetVy -= dir.y * 90
    }

    // Di dekat dinding, koreksi arah agar tetap di dalam arena.
    targetVx += wallSteerX * self.speed
    targetVy += wallSteerY * self.speed

    seekVelocity(self, targetVx, targetVy, dt, AI_ACCELERATION, AI_DECELERATION)
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

  // Kecepatan target mengikuti stat Speed bola.
  const targetSpeed = self.speed * (tooClose ? 0.85 : 1)
  seekVelocity(
    self,
    steerX * targetSpeed,
    steerY * targetSpeed,
    dt,
    AI_ACCELERATION,
    AI_DECELERATION,
  )

  // Jaga kecepatan minimum supaya bola tidak diam di tengah arena.
  const speed = Math.hypot(self.vx, self.vy)
  if (speed < MIN_STEER_SPEED) {
    self.vx += steerX * MIN_STEER_SPEED * dt * 6
    self.vy += steerY * MIN_STEER_SPEED * dt * 6
  }

  return 'chase'
}
