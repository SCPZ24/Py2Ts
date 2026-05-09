/**
 * useParticleSystem
 * 负责创建和管理粒子云：
 *   - 球形分布的 8000 个粒子
 *   - 圆形 sprite（canvas 径向渐变贴图）+ AdditiveBlending 叠光
 *   - 顶点色：由初始球坐标（方位角 + 极角）映射的彩虹 HSL
 *   - 每帧更新：粒子受鼠标排斥力 + 速度阻尼 + 回弹到初始位置
 *   - scroll 进度驱动粒子向外扩散
 *   - 整体绕 Y 轴慢速公转（Group），鼠标坐标会 worldToLocal 以保持排斥方向正确
 */

import * as THREE from 'three'

const PARTICLE_COUNT = 8000
const REPULSION_RADIUS = 0.8  // 鼠标排斥球半径（Three.js 世界单位）
const REPULSION_STRENGTH = 0.008
const DAMPING = 0.92           // 速度阻尼（< 1 让粒子弹回）
const RETURN_STRENGTH = 0.015  // 回弹到初始位置的力度
/** scroll 到底时相对初始半径的额外倍数（capture.md：1 + progress * factor） */
const SCROLL_EXPAND_FACTOR = 4.2

/** 粒子云绕场景 Y 轴角速度（弧度/秒），慢速如云带环绕主角 */
const PARTICLE_ORBIT_Y_RAD_PER_SEC = 0.085
/** 轻微 X 轴摆动（弧度），频率见下 */
const PARTICLE_ORBIT_X_WOBBLE_AMP_RAD = 0.038
/** sin 相位：elapsed(rad) * 该项 → 缓慢起伏 */
const PARTICLE_ORBIT_X_WOBBLE_FREQ = 0.65

/** Soft circular sprite for PointsMaterial (white core, transparent rim). */
function createParticleSpriteTexture(size = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('useParticleSystem: 2D canvas context unavailable')
  }
  const cx = size / 2
  const r = size / 2
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, r)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.35)')
  g.addColorStop(0.85, 'rgba(255,255,255,0.04)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.NoColorSpace
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

export interface ParticleSystem {
  points: THREE.Points
  /** 包住 Points 的根节点（公转施加在此 Group 上） */
  particleRoot: THREE.Group
  /**
   * 每帧调用：鼠标 3D（场景根坐标）+ scroll 进度 + 帧间隔与累计时间（用于公转与摆动）
   */
  update: (
    mousePos3D: THREE.Vector3,
    scrollProgress: number,
    deltaSec: number,
    elapsedSec: number,
  ) => void
  dispose: () => void
}

export function useParticleSystem(scene: THREE.Scene): ParticleSystem {
  const geometry = new THREE.BufferGeometry()

  // 记录初始位置（用于回弹）
  const initialPositions = new Float32Array(PARTICLE_COUNT * 3)
  // 当前位置
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  // 速度
  const velocities = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const tmpColor = new THREE.Color()

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // 球形随机分布，半径 0.5 ~ 2.5
    const r = Math.random() * 2.0 + 0.5
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.7  // 纵向压扁一些
    const z = r * Math.cos(phi)

    initialPositions[i * 3]     = x
    initialPositions[i * 3 + 1] = y
    initialPositions[i * 3 + 2] = z
    positions[i * 3]     = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    // 彩虹：色相由方位角 atan2(y,x)，极角微调让垂直方向也有色谱变化
    const len = Math.hypot(x, y, z) || 1
    const azimuth = Math.atan2(y, x)
    const polar = Math.acos(THREE.MathUtils.clamp(z / len, -1, 1))
    let hue = (azimuth + Math.PI) / (2 * Math.PI)
    hue = (hue + (polar / Math.PI) * 0.22) % 1
    tmpColor.setHSL(hue, 0.9, 0.52)
    colors[i * 3] = tmpColor.r
    colors[i * 3 + 1] = tmpColor.g
    colors[i * 3 + 2] = tmpColor.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const spriteMap = createParticleSpriteTexture()

  const material = new THREE.PointsMaterial({
    map: spriteMap,
    size: 0.045,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    alphaTest: 0.02,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  })

  const points = new THREE.Points(geometry, material)
  const particleRoot = new THREE.Group()
  particleRoot.add(points)
  scene.add(particleRoot)

  const mouseLocalScratch = new THREE.Vector3()

  function update(
    mousePos3D: THREE.Vector3,
    scrollProgress: number,
    deltaSec: number,
    elapsedSec: number,
  ) {
    particleRoot.rotation.y += PARTICLE_ORBIT_Y_RAD_PER_SEC * deltaSec
    particleRoot.rotation.x =
      Math.sin(elapsedSec * PARTICLE_ORBIT_X_WOBBLE_FREQ) * PARTICLE_ORBIT_X_WOBBLE_AMP_RAD
    particleRoot.updateMatrixWorld(true)

    mouseLocalScratch.copy(mousePos3D)
    particleRoot.worldToLocal(mouseLocalScratch)

    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const posArr = posAttr.array as Float32Array

    const p = Math.min(1, Math.max(0, scrollProgress))
    // 与文档一致：随 progress 放大；scroll > 0.5 后略加强 burst（俯视填满）
    const segmentBoost = p > 0.5 ? (p - 0.5) * 0.9 : 0
    const expandFactor = 1 + p * SCROLL_EXPAND_FACTOR + segmentBoost

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3
      const iy = i * 3 + 1
      const iz = i * 3 + 2

      // 当前位置（索引在 PARTICLE_COUNT 范围内，保证有效）
      let px = posArr[ix]!
      let py = posArr[iy]!
      let pz = posArr[iz]!

      // 鼠标排斥力（与粒子同一空间：particleRoot / Points 局部）
      const dx = px - mouseLocalScratch.x
      const dy = py - mouseLocalScratch.y
      const dz = pz - mouseLocalScratch.z
      const distSq = dx * dx + dy * dy + dz * dz
      const dist = Math.sqrt(distSq)

      if (dist < REPULSION_RADIUS && dist > 0.001) {
        const force = (REPULSION_RADIUS - dist) / REPULSION_RADIUS
        const normX = dx / dist
        const normY = dy / dist
        const normZ = dz / dist
        velocities[ix]! += normX * force * REPULSION_STRENGTH
        velocities[iy]! += normY * force * REPULSION_STRENGTH
        velocities[iz]! += normZ * force * REPULSION_STRENGTH
      }

      // 回弹力（弹向 初始位置 * 扩散倍数）
      const targetX = initialPositions[ix]! * expandFactor
      const targetY = initialPositions[iy]! * expandFactor
      const targetZ = initialPositions[iz]! * expandFactor
      velocities[ix]! += (targetX - px) * RETURN_STRENGTH
      velocities[iy]! += (targetY - py) * RETURN_STRENGTH
      velocities[iz]! += (targetZ - pz) * RETURN_STRENGTH

      // 应用速度 + 阻尼
      velocities[ix]! *= DAMPING
      velocities[iy]! *= DAMPING
      velocities[iz]! *= DAMPING
      posArr[ix] = px + velocities[ix]!
      posArr[iy] = py + velocities[iy]!
      posArr[iz] = pz + velocities[iz]!
    }

    posAttr.needsUpdate = true
  }

  function dispose() {
    scene.remove(particleRoot)
    geometry.dispose()
    spriteMap.dispose()
    material.dispose()
  }

  return { points, particleRoot, update, dispose }
}
