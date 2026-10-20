import { ARENA_SIZE, HIT_FLASH_DURATION } from './constants.ts'
import type { GameEngine } from './GameEngine.ts'
import type { Ball } from '../types.ts'

/** Palet flat/minimal sesuai Brief GDD bagian 5. */
export const PALETTE = {
  pageBackground: '#eef1f6',
  arenaFill: '#ffffff',
  arenaStroke: '#cbd5e1',
  arenaInner: '#f8fafc',
  guide: '#e2e8f0',
  text: '#334155',
}

/**
 * Renderer Canvas 2D bergaya flat/minimal.
 * Semua digambar langsung ke canvas, di luar React, supaya frame rate tetap 60fps.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D
  private width = 0
  private height = 0
  private scale = 1
  private offsetX = 0
  private offsetY = 0

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context tidak tersedia')
    this.ctx = ctx
  }

  /** Menyesuaikan ukuran canvas dengan ukuran tampil dan devicePixelRatio. */
  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.width = cssWidth
    this.height = cssHeight
    this.canvas.width = Math.round(cssWidth * dpr)
    this.canvas.height = Math.round(cssHeight * dpr)
    this.canvas.style.width = `${cssWidth}px`
    this.canvas.style.height = `${cssHeight}px`
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Arena mengikuti sisi terpendek dan dipusatkan.
    const size = Math.min(cssWidth, cssHeight)
    this.scale = size / ARENA_SIZE
    this.offsetX = cssWidth / 2
    this.offsetY = cssHeight / 2
  }

  /** Mengubah koordinat arena (virtual unit) menjadi koordinat canvas. */
  private toCanvas(x: number, y: number): { x: number; y: number } {
    return {
      x: this.offsetX + x * this.scale,
      y: this.offsetY + y * this.scale,
    }
  }

  render(engine: GameEngine): void {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    this.drawArena(engine.arenaHalf)
    this.drawSparks(engine)
    for (const ball of engine.balls) this.drawBall(ball)
    this.drawFloatingTexts(engine)
  }

  private drawArena(arenaHalf: number): void {
    const ctx = this.ctx
    const center = this.toCanvas(0, 0)
    const half = arenaHalf * this.scale

    ctx.save()
    ctx.fillStyle = PALETTE.arenaFill
    ctx.fillRect(center.x - half, center.y - half, half * 2, half * 2)

    ctx.strokeStyle = PALETTE.arenaStroke
    ctx.lineWidth = 3
    ctx.strokeRect(center.x - half, center.y - half, half * 2, half * 2)

    // Panduan dekoratif: garis tengah + kotak dalam.
    ctx.strokeStyle = PALETTE.guide
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(center.x - half, center.y)
    ctx.lineTo(center.x + half, center.y)
    ctx.moveTo(center.x, center.y - half)
    ctx.lineTo(center.x, center.y + half)
    ctx.stroke()

    ctx.strokeRect(center.x - half * 0.5, center.y - half * 0.5, half, half)
    ctx.restore()
  }

  private drawBall(ball: Ball): void {
    const ctx = this.ctx
    const center = this.toCanvas(ball.x, ball.y)
    const radius = ball.radius * this.scale

    ctx.save()

    // Bayangan tipis sebagai penanda posisi di lantai arena.
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)'
    ctx.beginPath()
    ctx.arc(center.x + radius * 0.08, center.y + radius * 0.12, radius, 0, Math.PI * 2)
    ctx.fill()

    // Flash putih saat terkena damage.
    const flashRatio = Math.min(1, ball.hitFlash / HIT_FLASH_DURATION)

    ctx.fillStyle = ball.color
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
    ctx.fill()

    if (flashRatio > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.65 * flashRatio})`
      ctx.beginPath()
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = ball.strokeColor
    ctx.lineWidth = Math.max(1.5, radius * 0.12)
    ctx.stroke()

    // Penanda arahAI (segitiga kecil) agar gerakan terbaca.
    const facing = ball.facing
    const markerSize = radius * 0.42
    const mx = center.x + Math.cos(facing) * radius * 0.62
    const my = center.y + Math.sin(facing) * radius * 0.62
    ctx.fillStyle = ball.strokeColor
    ctx.beginPath()
    ctx.moveTo(mx + Math.cos(facing) * markerSize, my + Math.sin(facing) * markerSize)
    ctx.lineTo(
      mx + Math.cos(facing + 2.5) * markerSize,
      my + Math.sin(facing + 2.5) * markerSize,
    )
    ctx.lineTo(
      mx + Math.cos(facing - 2.5) * markerSize,
      my + Math.sin(facing - 2.5) * markerSize,
    )
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  private drawSparks(engine: GameEngine): void {
    const ctx = this.ctx
    ctx.save()
    for (const spark of engine.sparks) {
      const point = this.toCanvas(spark.x, spark.y)
      const ratio = Math.max(0, spark.life / spark.maxLife)
      ctx.fillStyle = `rgba(100, 116, 139, ${0.5 * ratio})`
      ctx.beginPath()
      ctx.arc(point.x, point.y, 8 * ratio, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawFloatingTexts(engine: GameEngine): void {
    const ctx = this.ctx
    ctx.save()
    ctx.font = '600 16px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const text of engine.floatingTexts) {
      const point = this.toCanvas(text.x, text.y)
      const ratio = Math.max(0, text.life / text.maxLife)
      ctx.globalAlpha = ratio
      ctx.fillStyle = text.color
      ctx.fillText(text.text, point.x, point.y)
    }
    ctx.restore()
  }
}
