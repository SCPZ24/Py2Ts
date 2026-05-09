/**
 * useParticleSystem
 * 负责创建和管理粒子云：
 *   - 球形分布的 8000 个粒子
 *   - AdditiveBlending（加法混合）让粒子重叠处发光
 *   - 每帧更新：粒子受鼠标排斥力 + 速度阻尼 + 回弹到初始位置
 *   - scroll 进度驱动粒子向外扩散
 */

import * as THREE from 'three'

const PARTICLE_COUNT = 8000
const REPULSION_RADIUS = 0.8  // 鼠标排斥球半径（Three.js 世界单位）
const REPULSION_STRENGTH = 0.008
const DAMPING = 0.92           // 速度阻尼（< 1 让粒子弹回）
const RETURN_STRENGTH = 0.015  // 回弹到初始位置的力度

export interface ParticleSystem {
  points: THREE.Points
  /** 每帧调用，传入鼠标 3D 位置和 scroll 进度 */
  update: (mousePos3D: THREE.Vector3, scrollProgress: number) => void
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
  // 粒子大小（让粒子有一定变化）
  const sizes = new Float32Array(PARTICLE_COUNT)
  // 颜色（金黄色 → 绿色随机混合，scroll 后会变紫）
  const colors = new Float32Array(PARTICLE_COUNT * 3)

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

    sizes[i] = Math.random() * 2.5 + 0.5

    // 颜色：随机在 金黄 / 黄绿 / 浅蓝 之间
    const colorRand = Math.random()
    if (colorRand < 0.5) {
      // 金黄色
      colors[i * 3]     = 0.7 + Math.random() * 0.3
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.3
      colors[i * 3 + 2] = 0.1 + Math.random() * 0.1
    } else if (colorRand < 0.8) {
      // 黄绿色
      colors[i * 3]     = 0.3 + Math.random() * 0.3
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.3
      colors[i * 3 + 2] = 0.1 + Math.random() * 0.2
    } else {
      // 浅蓝/白
      colors[i * 3]     = 0.5 + Math.random() * 0.5
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.3
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // 使用自定义 ShaderMaterial 以支持 aSize 和颜色
  const material = new THREE.PointsMaterial({
    size: 0.025,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending, // 关键：让重叠粒子叠加发光
    depthWrite: false,
    vertexColors: true,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  // 用于记录 scroll 扩散因子，平滑插值
  let currentExpandFactor = 1.0

  function update(mousePos3D: THREE.Vector3, scrollProgress: number) {
    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const posArr = posAttr.array as Float32Array

    // scroll 目标扩散倍数（scroll 到底时粒子扩散到 4 倍）
    const targetExpand = 1.0 + scrollProgress * 3.0
    // lerp 平滑追上目标
    currentExpandFactor += (targetExpand - currentExpandFactor) * 0.05

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3
      const iy = i * 3 + 1
      const iz = i * 3 + 2

      // 当前位置
      let px = posArr[ix]
      let py = posArr[iy]
      let pz = posArr[iz]

      // 鼠标排斥力
      const dx = px - mousePos3D.x
      const dy = py - mousePos3D.y
      const dz = pz - mousePos3D.z
      const distSq = dx * dx + dy * dy + dz * dz
      const dist = Math.sqrt(distSq)

      if (dist < REPULSION_RADIUS && dist > 0.001) {
        const force = (REPULSION_RADIUS - dist) / REPULSION_RADIUS
        const normX = dx / dist
        const normY = dy / dist
        const normZ = dz / dist
        velocities[ix] += normX * force * REPULSION_STRENGTH
        velocities[iy] += normY * force * REPULSION_STRENGTH
        velocities[iz] += normZ * force * REPULSION_STRENGTH
      }

      // 回弹力（弹向 初始位置 * 扩散倍数）
      const targetX = initialPositions[ix]     * currentExpandFactor
      const targetY = initialPositions[iy]     * currentExpandFactor
      const targetZ = initialPositions[iz]     * currentExpandFactor
      velocities[ix] += (targetX - px) * RETURN_STRENGTH
      velocities[iy] += (targetY - py) * RETURN_STRENGTH
      velocities[iz] += (targetZ - pz) * RETURN_STRENGTH

      // 应用速度 + 阻尼
      velocities[ix] *= DAMPING
      velocities[iy] *= DAMPING
      velocities[iz] *= DAMPING
      posArr[ix] = px + velocities[ix]
      posArr[iy] = py + velocities[iy]
      posArr[iz] = pz + velocities[iz]
    }

    posAttr.needsUpdate = true
  }

  function dispose() {
    scene.remove(points)
    geometry.dispose()
    material.dispose()
  }

  return { points, update, dispose }
}
