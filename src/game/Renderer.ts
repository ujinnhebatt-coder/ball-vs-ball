import { ARENA_SIZE, HIT_FLASH_DURATION } from './constants.ts'
import { shadeColor, withAlpha } from './ColorUtils.ts'
import type { GameEngine } from './GameEngine.ts'
import type { Ball } from '../types.ts'

/** Palet arena (gaya bersih dengan kedalaman visual). */
export const PALETTE = {
  pageBackground: '#e7ebf1',
  floorTop: '#ffffff',
  floorBottom: '#eef1f6',
  floorGrid: '#e6eaf0',
  wallTop: '#dbe2ec',
  wallSide: '#c3ccda',
  wallDark: '#aeb9c9',
  wallInnerShadow: '#cbd5e1',
  wallOutline: '#b6c1d1',
  noise: '#64748b',
  vignette: '#0f172a',
  guide: '#dfe5ee',
  text: '#334155',
}

/** Arah sumber cahaya global (arah dari bola menuju cahaya). */
const LIGHT = { x: -0.42, y: -0.5 }

/**
 * Renderer Canvas 2D dengan pencahayaan sederhana: bola digambar sebagai
 * bola 3D (gradasi + specular + rim light), lantai bertekstur noise,
 * dan dinding yang terlihat berkedalaman.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D
  private width = 0
  private height = 0
  private scale = 1
  private offsetX = 0
  private offsetY = 0
  private noisePattern: CanvasPattern | null = null

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context tidak tersedia')
    this.ctx = ctx
    this.noisePattern = this.createNoisePattern()
  }

  /** Membuat pola noise 128×128 sekali saja, dipakai sebagai tekstur lantai. */
  private createNoisePattern(): CanvasPattern | null {
    const size = 128
    const tile = document.createElement('canvas')
    tile.width = size
    tile.height = size
    const tileCtx = tile.getContext('2d')
    if (!tileCtx) return null

    const image = tileCtx.createImageData(size, size)
    for (let i = 0; i < image.data.length; i += 4) {
      const value = 128 + (Math.random() - 0.5) * 90
      image.data[i] = value
      image.data[i + 1] = value
      image.data[i + 2] = value
      image.data[i + 3] = 26
    }
    tileCtx.putImageData(image, 0, 0)
    return this.ctx.createPattern(tile, 'repeat')
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

  /** Skala pixel per unit arena (untuk konversi toleransi pointer). */
  arenaScale(): number {
    return this.scale
  }

  /** Mengubah koordinat arena (virtual unit) menjadi koordinat canvas. */
  private toCanvas(x: number, y: number): { x: number; y: number } {
    return {
      x: this.offsetX + x * this.scale,
      y: this.offsetY + y * this.scale,
    }
  }

  /** Mengubah koordinat pointer (client) menjadi koordinat arena. */
  toArena(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left - this.offsetX) / this.scale,
      y: (clientY - rect.top - this.offsetY) / this.scale,
    }
  }

  /** Mengubah koordinat arena menjadi koordinat layar (client). */
  arenaToClient(x: number, y: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const point = this.toCanvas(x, y)
    return { x: rect.left + point.x, y: rect.top + point.y }
  }

  render(engine: GameEngine, activeBallId?: number): void {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    this.drawArena(engine.arenaHalf)
    this.drawSparks(engine)
    for (const ball of engine.balls) this.drawBall(ball, engine)
    if (engine.phase === 'aim') {
      for (const ball of engine.balls) this.drawAimArrow(ball, ball.id === activeBallId)
    }
    this.drawFloatingTexts(engine)
  }

  /** Lantai arena: gradasi, tekstur noise, grid, vignette, dinding berkedalaman. */
  private drawArena(arenaHalf: number): void {
    const ctx = this.ctx
    const center = this.toCanvas(0, 0)
    const half = arenaHalf * this.scale
    const wallThickness = Math.max(8, half * 0.045)

    ctx.save()

    // 1) Bayangan luar arena (dinding berdiri di atas lantai halaman).
    ctx.shadowColor = 'rgba(15, 23, 42, 0.18)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 10
    ctx.fillStyle = PALETTE.wallSide
    ctx.fillRect(
      center.x - half - wallThickness,
      center.y - half - wallThickness,
      (half + wallThickness) * 2,
      (half + wallThickness) * 2,
    )
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // 2) Lantai arena dengan gradasi pencahayaan.
    const floor = ctx.createLinearGradient(
      center.x - half,
      center.y - half,
      center.x + half,
      center.y + half,
    )
    floor.addColorStop(0, PALETTE.floorTop)
    floor.addColorStop(1, PALETTE.floorBottom)
    ctx.fillStyle = floor
    ctx.fillRect(center.x - half, center.y - half, half * 2, half * 2)

    // 3) Tekstur noise halus.
    if (this.noisePattern) {
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.fillStyle = this.noisePattern
      ctx.fillRect(center.x - half, center.y - half, half * 2, half * 2)
      ctx.restore()
    }

    // 4) Grid halus sebagai penanda skala.
    ctx.strokeStyle = PALETTE.floorGrid
    ctx.lineWidth = 1
    ctx.beginPath()
    const gridStep = 50 * this.scale
    for (let x = center.x - half + gridStep; x < center.x + half; x += gridStep) {
      ctx.moveTo(Math.round(x) + 0.5, center.y - half)
      ctx.lineTo(Math.round(x) + 0.5, center.y + half)
    }
    for (let y = center.y - half + gridStep; y < center.y + half; y += gridStep) {
      ctx.moveTo(center.x - half, Math.round(y) + 0.5)
      ctx.lineTo(center.x + half, Math.round(y) + 0.5)
    }
    ctx.stroke()

    // 5) Vignette di sudut arena.
    const vignette = ctx.createRadialGradient(
      center.x,
      center.y,
      half * 0.35,
      center.x,
      center.y,
      half * 1.25,
    )
    vignette.addColorStop(0, withAlpha(PALETTE.vignette, 0))
    vignette.addColorStop(1, withAlpha(PALETTE.vignette, 0.12))
    ctx.fillStyle = vignette
    ctx.fillRect(center.x - half, center.y - half, half * 2, half * 2)

    // 6) Inner shadow di keempat sisi (efek kedalaman dinding).
    this.drawInnerShadow(center.x - half, center.y - half, half * 2, half * 2)

    // 7) Dinding: pita tebal dengan gradasi pencahayaan + outline.
    const wall = ctx.createLinearGradient(
      center.x,
      center.y - half - wallThickness,
      center.x,
      center.y + half + wallThickness,
    )
    wall.addColorStop(0, PALETTE.wallTop)
    wall.addColorStop(0.5, PALETTE.wallSide)
    wall.addColorStop(1, PALETTE.wallDark)
    ctx.strokeStyle = wall
    ctx.lineWidth = wallThickness
    ctx.strokeRect(center.x - half, center.y - half, half * 2, half * 2)

    ctx.strokeStyle = PALETTE.wallOutline
    ctx.lineWidth = 1
    ctx.strokeRect(
      center.x - half - wallThickness / 2,
      center.y - half - wallThickness / 2,
      half * 2 + wallThickness,
      half * 2 + wallThickness,
    )

    // 8) Garis arena dalam (batas area main) yang sedikit gelap.
    ctx.strokeStyle = withAlpha(PALETTE.wallInnerShadow, 0.9)
    ctx.lineWidth = 2
    ctx.strokeRect(center.x - half, center.y - half, half * 2, half * 2)

    ctx.restore()
  }

  /** Bayangan dalam lembut di sepanjang sisi dinding arena. */
  private drawInnerShadow(x: number, y: number, width: number, height: number): void {
    const ctx = this.ctx
    const depth = Math.max(10, width * 0.06)

    const top = ctx.createLinearGradient(0, y, 0, y + depth)
    top.addColorStop(0, withAlpha(PALETTE.wallInnerShadow, 0.5))
    top.addColorStop(1, withAlpha(PALETTE.wallInnerShadow, 0))
    ctx.fillStyle = top
    ctx.fillRect(x, y, width, depth)

    const bottom = ctx.createLinearGradient(0, y + height, 0, y + height - depth)
    bottom.addColorStop(0, withAlpha(PALETTE.wallInnerShadow, 0.5))
    bottom.addColorStop(1, withAlpha(PALETTE.wallInnerShadow, 0))
    ctx.fillStyle = bottom
    ctx.fillRect(x, y + height - depth, width, depth)

    const left = ctx.createLinearGradient(x, 0, x + depth, 0)
    left.addColorStop(0, withAlpha(PALETTE.wallInnerShadow, 0.5))
    left.addColorStop(1, withAlpha(PALETTE.wallInnerShadow, 0))
    ctx.fillStyle = left
    ctx.fillRect(x, y, depth, height)

    const right = ctx.createLinearGradient(x + width, 0, x + width - depth, 0)
    right.addColorStop(0, withAlpha(PALETTE.wallInnerShadow, 0.5))
    right.addColorStop(1, withAlpha(PALETTE.wallInnerShadow, 0))
    ctx.fillStyle = right
    ctx.fillRect(x + width - depth, y, depth, height)
  }

  /** Bola dengan gradasi 3D, specular highlight, rim light, dan bayangan. */
  private drawBall(ball: Ball, engine: GameEngine): void {
    const ctx = this.ctx
    const center = this.toCanvas(ball.x, ball.y)
    const radius = ball.radius * this.scale
    const lightX = center.x + LIGHT.x * radius
    const lightY = center.y + LIGHT.y * radius

    ctx.save()

    // Bayangan jatuh (bayangan di bawah, agak geser mengikuti cahaya).
    ctx.shadowColor = 'rgba(15, 23, 42, 0.28)'
    ctx.shadowBlur = radius * 0.8
    ctx.shadowOffsetX = -LIGHT.x * radius * 0.5
    ctx.shadowOffsetY = -LIGHT.y * radius * 0.5 + radius * 0.35
    ctx.fillStyle = 'rgba(15, 23, 42, 0.001)'
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Contact shadow: gumpalan gelap lembut di lantai.
    const contact = ctx.createRadialGradient(
      center.x - LIGHT.x * radius * 0.35,
      center.y - LIGHT.y * radius * 0.35,
      radius * 0.1,
      center.x,
      center.y,
      radius * 1.02,
    )
    contact.addColorStop(0, withAlpha('#0f172a', 0.16))
    contact.addColorStop(0.75, withAlpha('#0f172a', 0.05))
    contact.addColorStop(1, withAlpha('#0f172a', 0))
    ctx.fillStyle = contact
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius * 1.02, 0, Math.PI * 2)
    ctx.fill()

    // Badan bola: gradasi radial dari titik cahaya.
    const body = ctx.createRadialGradient(
      lightX,
      lightY,
      radius * 0.05,
      center.x,
      center.y,
      radius * 1.08,
    )
    body.addColorStop(0, shadeColor(ball.color, 0.55))
    body.addColorStop(0.35, shadeColor(ball.color, 0.12))
    body.addColorStop(0.75, ball.color)
    body.addColorStop(1, shadeColor(ball.color, -0.42))
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
    ctx.fill()

    // Rim light di sisi berlawanan dengan cahaya (pantulan lantai).
    ctx.save()
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius * 0.99, 0, Math.PI * 2)
    ctx.clip()
    const rim = ctx.createRadialGradient(
      center.x - LIGHT.x * radius * 1.25,
      center.y - LIGHT.y * radius * 1.25,
      radius * 0.25,
      center.x - LIGHT.x * radius * 1.25,
      center.y - LIGHT.y * radius * 1.25,
      radius * 1.1,
    )
    rim.addColorStop(0, withAlpha(shadeColor(ball.color, 0.7), 0.55))
    rim.addColorStop(1, withAlpha(shadeColor(ball.color, 0.7), 0))
    ctx.fillStyle = rim
    ctx.fillRect(
      center.x - radius * 1.1,
      center.y - radius * 1.1,
      radius * 2.2,
      radius * 2.2,
    )
    ctx.restore()

    // Specular highlight.
    const specular = ctx.createRadialGradient(
      lightX,
      lightY,
      0,
      lightX,
      lightY,
      radius * 0.52,
    )
    specular.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
    specular.addColorStop(0.45, 'rgba(255, 255, 255, 0.22)')
    specular.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = specular
    ctx.beginPath()
    ctx.arc(lightX, lightY, radius * 0.52, 0, Math.PI * 2)
    ctx.fill()

    // Flash putih saat terkena damage.
    const flashRatio = Math.min(1, ball.hitFlash / HIT_FLASH_DURATION)
    if (flashRatio > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * flashRatio})`
      ctx.beginPath()
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Outline tipis untuk memisahkan bola dari lantai.
    ctx.strokeStyle = withAlpha(ball.strokeColor, 0.85)
    ctx.lineWidth = Math.max(1, radius * 0.07)
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Penanda arah AI (segitiga kecil) agar gerakan terbaca.
    if (engine.phase !== 'aim') {
      const facing = ball.facing
      const markerSize = radius * 0.34
      const mx = center.x + Math.cos(facing) * radius * 0.66
      const my = center.y + Math.sin(facing) * radius * 0.66
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
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
    }

    ctx.restore()
  }

  /** Panah arah luncur yang bisa di-drag saat fase aim. */
  private drawAimArrow(ball: Ball, isActive: boolean): void {
    const ctx = this.ctx
    const center = this.toCanvas(ball.x, ball.y)
    const radius = ball.radius * this.scale
    const length = radius * (isActive ? 3.9 : 2.9)
    const angle = ball.aimAngle
    const tipX = center.x + Math.cos(angle) * length
    const tipY = center.y + Math.sin(angle) * length

    ctx.save()

    // Batang panah.
    ctx.strokeStyle = withAlpha(shadeColor(ball.color, -0.15), isActive ? 1 : 0.45)
    ctx.lineWidth = Math.max(3, radius * (isActive ? 0.26 : 0.18))
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    ctx.lineTo(tipX, tipY)
    ctx.stroke()

    // Kepala panah.
    const headSize = radius * 0.72
    ctx.fillStyle = withAlpha(shadeColor(ball.color, -0.15), isActive ? 1 : 0.5)
    ctx.beginPath()
    ctx.moveTo(tipX + Math.cos(angle) * headSize, tipY + Math.sin(angle) * headSize)
    ctx.lineTo(
      tipX + Math.cos(angle + 2.6) * headSize,
      tipY + Math.sin(angle + 2.6) * headSize,
    )
    ctx.lineTo(
      tipX + Math.cos(angle - 2.6) * headSize,
      tipY + Math.sin(angle - 2.6) * headSize,
    )
    ctx.closePath()
    ctx.fill()

    // Handle di ujung panah (tanda area drag), digeser sedikit agar
    // kepala panah tetap terlihat.
    const handleX = tipX - Math.cos(angle) * headSize * 0.85
    const handleY = tipY - Math.sin(angle) * headSize * 0.85
    ctx.fillStyle = `rgba(255, 255, 255, ${isActive ? 0.95 : 0.55})`
    ctx.strokeStyle = withAlpha(shadeColor(ball.color, -0.3), isActive ? 0.95 : 0.5)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(handleX, handleY, radius * (isActive ? 0.3 : 0.24), 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Cincin penanda bola yang sedang aktif.
    if (isActive) {
      ctx.strokeStyle = withAlpha(shadeColor(ball.color, 0.4), 0.75)
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(center.x, center.y, radius * 1.45, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Sudut dalam derajat di dekat pangkal panah.
    const degrees = Math.round(((angle * 180) / Math.PI + 360) % 360)
    ctx.font = `600 ${Math.max(11, radius * 0.5)}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = withAlpha(PALETTE.text, isActive ? 0.9 : 0.4)
    ctx.fillText(
      `${degrees}°`,
      center.x - Math.cos(angle) * radius * 2.2,
      center.y - Math.sin(angle) * radius * 2.2,
    )

    ctx.restore()
  }

  private drawSparks(engine: GameEngine): void {
    const ctx = this.ctx
    ctx.save()
    for (const spark of engine.sparks) {
      const point = this.toCanvas(spark.x, spark.y)
      const ratio = Math.max(0, spark.life / spark.maxLife)
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 10 * ratio)
      gradient.addColorStop(0, `rgba(255, 255, 255, ${0.85 * ratio})`)
      gradient.addColorStop(0.5, `rgba(148, 163, 184, ${0.45 * ratio})`)
      gradient.addColorStop(1, 'rgba(148, 163, 184, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(point.x, point.y, 10 * ratio, 0, Math.PI * 2)
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
