/**
 * useScrollAnimation
 * 用 GSAP ScrollTrigger 将页面 scroll 进度转换为相机运动。
 *
 * scroll 0 → 0.4：相机从高处向下俯冲，透视角缩小
 * scroll 0.4 → 0.7：相机绕 Z 轴旋转 + 继续下移，模拟"穿越粒子云"
 * scroll 0.7 → 1.0：相机拉回，视角稳定在较近距离
 *
 * 每一段都通过 gsap.utils.interpolate 做平滑过渡。
 */

import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export interface ScrollAnimationHandle {
  /** 当前 scroll 进度 0~1 */
  progress: { value: number }
  dispose: () => void
}

export function useScrollAnimation(
  camera: THREE.PerspectiveCamera,
): ScrollAnimationHandle {
  const progress = { value: 0 }

  // 用一个 proxy 对象接收 GSAP 的 tween
  const proxy = { t: 0 }

  const tween = gsap.to(proxy, {
    t: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,   // 1.5 秒的滚动惯性（越大越"懒"）
      onUpdate: (self) => {
        progress.value = self.progress
        applyCameraTransform(camera, self.progress)
      },
    },
  })

  function dispose() {
    tween.kill()
    ScrollTrigger.killAll()
  }

  return { progress, dispose }
}

/**
 * 根据 scroll 进度（0~1）计算相机的位置和旋转
 */
function applyCameraTransform(
  camera: THREE.PerspectiveCamera,
  t: number,
) {
  const lerp = gsap.utils.interpolate

  if (t < 0.4) {
    // 第一段：正面俯视，相机缓缓靠近
    const s = t / 0.4
    camera.position.set(
      lerp(0, 0, s),
      lerp(0.2, -0.5, s),
      lerp(3.5, 2.0, s),
    )
    camera.rotation.set(
      lerp(0, 0.15, s),
      0,
      0,
    )
  } else if (t < 0.7) {
    // 第二段：相机下潜 + 轻微横滚，像是穿越粒子云
    const s = (t - 0.4) / 0.3
    camera.position.set(
      lerp(0, 0.3, s),
      lerp(-0.5, -2.0, s),
      lerp(2.0, 0.5, s),
    )
    camera.rotation.set(
      lerp(0.15, 0.6, s),
      lerp(0, 0.2, s),
      lerp(0, 0.3, s),
    )
  } else {
    // 第三段：上升回来，从下往上仰视
    const s = (t - 0.7) / 0.3
    camera.position.set(
      lerp(0.3, 0, s),
      lerp(-2.0, -0.5, s),
      lerp(0.5, 2.5, s),
    )
    camera.rotation.set(
      lerp(0.6, -0.1, s),
      lerp(0.2, 0, s),
      lerp(0.3, 0, s),
    )
  }
}
