import { ATTACK_REARM, BASIC_ATTACK_COOLDOWN, HIT_FLASH_DURATION } from './constants.ts'
import type { Ball } from '../types.ts'

/** Statistik tempur per bola untuk layar hasil. */
export interface BallCombatStats {
  damageDealt: number
  damageTaken: number
  attacks: number
  hits: number
}

/**
 * Formula damage dari GDD bagian 7:
 *   D = max(1, Attack - Defense)
 */
export function computeDamage(attacker: Ball, defender: Ball): number {
  return Math.max(1, Math.round(attacker.attack - defender.defense))
}

/**
 * Serangan dasar: cek apakah target berada dalam jangkauan dan cooldown sudah siap.
 * Mengembalikan damage yang diberikan, atau 0 bila serangan tidak terjadi.
 */
export function performBasicAttack(
  attacker: Ball,
  defender: Ball,
  stats: Record<number, BallCombatStats>,
): number {
  if (attacker.hp <= 0 || defender.hp <= 0) return 0
  if (attacker.attackCooldown > 0) return 0

  const dx = defender.x - attacker.x
  const dy = defender.y - attacker.y
  const distance = Math.hypot(dx, dy)
  if (distance > attacker.attackRange) return 0

  const damage = computeDamage(attacker, defender)
  defender.hp = Math.max(0, defender.hp - damage)
  defender.hitFlash = HIT_FLASH_DURATION
  defender.recoverTimer = Math.max(defender.recoverTimer, 0.3)

  attacker.attackCooldown = BASIC_ATTACK_COOLDOWN + ATTACK_REARM
  attacker.facing = Math.atan2(dy, dx)
  // Setelah successfully land a hit, attacker mundur sebentar untuk
  // menciptakan jarak dan membuat ritme duel tidak monoton.
  attacker.repositionTimer = 0.45 + Math.random() * 0.35

  const attackerStats = stats[attacker.id]
  const defenderStats = stats[defender.id]
  if (attackerStats) {
    attackerStats.attacks += 1
    attackerStats.damageDealt += damage
    attackerStats.hits += 1
  }
  if (defenderStats) {
    defenderStats.damageTaken += damage
  }

  return damage
}

/** Mengurangi cooldown serangan dasar secara berkala. */
export function tickAttackCooldown(ball: Ball, dt: number): void {
  if (ball.attackCooldown > 0) {
    ball.attackCooldown = Math.max(0, ball.attackCooldown - dt)
  }
}
