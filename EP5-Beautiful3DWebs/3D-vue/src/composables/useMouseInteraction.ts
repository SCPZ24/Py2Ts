/**
 * useMouseInteraction
 * 处理两种鼠标交互效果：
 *
 * 1. 相机视差（Parallax）：鼠标移向屏幕边缘时，相机轻微偏转，增强空间感
 *    实现：每帧用 lerp 平滑地让相机 rotation 追向目标值
 *
 * 2. 鼠标 3D 位置计算：把鼠标的 2D 屏幕坐标转换为 Three.js 3D 空间坐标
 *    供粒子系统用于计算排斥力
 *
 * 注意：相机视差和 scroll 动画会叠加。scroll 设置的是 camera.position，
 * 鼠标视差只微调 camera.rotation（两者不冲突）。
 */

import * as THREE from 'three'

export interface MouseInteractionHandle {
  /** 当前帧鼠标在 Three.js 世界中的近似 3D 位置 */
  mousePos3D: THREE.Vector3
  /** 每帧调用，更新相机旋转的视差偏移 */
  update: (camera: THREE.PerspectiveCamera, baseRotation: THREE.Euler) => void
  dispose: () => void
}

export function useMouseInteraction(): MouseInteractionHandle {
  // NDC 坐标（Normalized Device Coordinates），范围 -1 ~ 1
  const mouse = new THREE.Vector2(0, 0)
  const mousePos3D = new THREE.Vector3(0, 0, 2)

  // 平滑后的鼠标目标旋转偏移
  const targetOffsetX = { value: 0 }
  const targetOffsetY = { value: 0 }
  const currentOffsetX = { value: 0 }
  const currentOffsetY = { value: 0 }

  function onMouseMove(e: MouseEvent) {
    // 转换为 NDC（-1 ~ 1）
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

    // 目标视差旋转角度（小幅度，最多 ±0.15 弧度）
    targetOffsetX.value = -mouse.y * 0.12
    targetOffsetY.value =  mouse.x * 0.15

    // 鼠标 3D 位置：用简单的线性映射代替 unproject
    // 在相机前方 z=2 平面上移动（粒子排斥用，不需要非常精确）
    mousePos3D.set(mouse.x * 2.0, mouse.y * 1.5, 2.0)
  }

  window.addEventListener('mousemove', onMouseMove)

  function update(camera: THREE.PerspectiveCamera, baseRotation: THREE.Euler) {
    // lerp：以 5% 的速度逐帧追向目标（产生惯性感）
    const lerpFactor = 0.04
    currentOffsetX.value += (targetOffsetX.value - currentOffsetX.value) * lerpFactor
    currentOffsetY.value += (targetOffsetY.value - currentOffsetY.value) * lerpFactor

    // 在 scroll 设定的基础旋转之上叠加视差偏移
    camera.rotation.x = baseRotation.x + currentOffsetX.value
    camera.rotation.y = baseRotation.y + currentOffsetY.value
  }

  function dispose() {
    window.removeEventListener('mousemove', onMouseMove)
  }

  return { mousePos3D, update, dispose }
}
