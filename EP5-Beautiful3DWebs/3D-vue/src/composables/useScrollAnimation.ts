/**
 * useScrollAnimation
 * 用 GSAP ScrollTrigger 将页面 scroll 进度转换为相机运动（对应 capture.md 截图 02–04）。
 *
 * 0 → 0.30：下潜 — 从首屏高位前推并下降，进入粒子云
 * 0.30 → 0.50：斜侧 / 俯视感 — 位移 + 绕视线横滚（lookAt 后 rotateZ）
 * 0.50 → 1.0：继续下沉并略收，强化俯视填满画面
 *
 * 位姿用 THREE.MathUtils.lerp；朝向原点 lookAt(0,0,0)，再叠加横滚。
 */

import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** 与 capture.md 示例一致的主阶段分界（便于对照文档） */
export const SCROLL_DIVE_END = 0.3
export const SCROLL_ROT_END = 0.5

const TARGET = new THREE.Vector3(0, 0, 0)
const WORLD_UP = new THREE.Vector3(0, 1, 0)

export interface ScrollAnimationHandle {
  /** 当前 scroll 进度 0~1 */
  progress: { value: number }
  /** 仅由 ScrollTrigger 驱动的位姿，不含鼠标视差；渲染循环每帧应先同步到 camera 再叠视差 */
  scrollBase: { position: THREE.Vector3; rotation: THREE.Euler }
  dispose: () => void
}

export function useScrollAnimation(
  camera: THREE.PerspectiveCamera,
): ScrollAnimationHandle {
  const progress = { value: 0 }
  const scrollBase = {
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
  }

  function captureScrollBaseFromCamera() {
    scrollBase.position.copy(camera.position)
    scrollBase.rotation.copy(camera.rotation)
  }

  // 与 progress=0 对齐，避免首帧 ScrollTrigger 未回调时相机与 scroll 基准不一致
  updateCameraFromScroll(camera, 0)
  captureScrollBaseFromCamera()

  // 用一个 proxy 对象接收 GSAP 的 tween
  const proxy = { t: 0 }

  const tween = gsap.to(proxy, {
    t: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        progress.value = self.progress
        updateCameraFromScroll(camera, self.progress)
        captureScrollBaseFromCamera()
      },
    },
  })

  function dispose() {
    tween.scrollTrigger?.kill()
    tween.kill()
  }

  return { progress, scrollBase, dispose }
}

/**
 * 根据 scroll 进度（0~1）更新相机：关键帧位置 lerp → lookAt 原点 → 横滚。
 * 与 useThreeScene 首帧 (0, 0.2, 3.5) 对齐。
 */
export function updateCameraFromScroll(
  camera: THREE.PerspectiveCamera,
  progress: number,
) {
  const lerp = THREE.MathUtils.lerp
  const t = Math.min(1, Math.max(0, progress))

  // 首屏 → 穿入云中 → 斜侧/俯视
  const p0 = { x: 0, y: 0.2, z: 3.5 }
  const p1 = { x: 0, y: -1.35, z: 0.72 }
  const p2 = { x: 0.95, y: -2.45, z: 0.22 }
  const p3 = { x: 0.42, y: -3.05, z: 0.08 }

  let x: number
  let y: number
  let z: number
  let roll: number

  if (t < SCROLL_DIVE_END) {
    const s = t / SCROLL_DIVE_END
    x = lerp(p0.x, p1.x, s)
    y = lerp(p0.y, p1.y, s)
    z = lerp(p0.z, p1.z, s)
    roll = lerp(0, 0.08, s)
  } else if (t < SCROLL_ROT_END) {
    const s = (t - SCROLL_DIVE_END) / (SCROLL_ROT_END - SCROLL_DIVE_END)
    x = lerp(p1.x, p2.x, s)
    y = lerp(p1.y, p2.y, s)
    z = lerp(p1.z, p2.z, s)
    roll = lerp(0.08, Math.PI * 0.42, s)
  } else {
    const s = (t - SCROLL_ROT_END) / (1 - SCROLL_ROT_END)
    x = lerp(p2.x, p3.x, s)
    y = lerp(p2.y, p3.y, s)
    z = lerp(p2.z, p3.z, s)
    roll = lerp(Math.PI * 0.42, Math.PI * 0.5, s)
  }

  camera.position.set(x, y, z)
  camera.up.copy(WORLD_UP)
  camera.lookAt(TARGET)
  camera.rotateZ(roll)
}
