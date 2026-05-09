/**
 * useThreeScene
 * 负责创建和管理 Three.js 场景的核心对象：
 *   - WebGLRenderer（渲染器）
 *   - PerspectiveCamera（透视相机）
 *   - Scene（场景）
 *   - 环境光/点光源
 *   - 主角几何体（虹彩外六边形环 + 玻璃字 K，K 为相机朝向 billboard）
 *   - 后处理（UnrealBloomPass 辉光）
 *   - 渲染循环（requestAnimationFrame）
 */

import * as THREE from 'three'
import helvetikerBoldFont from 'three/examples/fonts/helvetiker_bold.typeface.json'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

export interface ThreeContext {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  composer: EffectComposer
  torusGroup: THREE.Group
  letterK: THREE.Mesh
  clock: THREE.Clock
  dispose: () => void
}

/** K 在圆环组局部空间中的锚点（原 group 内 letterK.position） */
const LETTER_LOCAL = new THREE.Vector3(0, 0, 0.11)
const _letterWorldScratch = new THREE.Vector3()

/** 正六边形中心线（XY 平面，平顶），用于 TubeGeometry 厚环 */
function createHexRingPath(circumradius: number): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>()
  for (let i = 0; i < 6; i++) {
    const a0 = (Math.PI / 3) * i + Math.PI / 6
    const a1 = (Math.PI / 3) * (i + 1) + Math.PI / 6
    const p0 = new THREE.Vector3(
      circumradius * Math.cos(a0),
      circumradius * Math.sin(a0),
      0,
    )
    const p1 = new THREE.Vector3(
      circumradius * Math.cos(a1),
      circumradius * Math.sin(a1),
      0,
    )
    path.add(new THREE.LineCurve3(p0, p1))
  }
  return path
}

/**
 * 创建虹彩外六边形环 + 中心玻璃字 K
 * 使用闭合折线 + TubeGeometry；MeshPhysicalMaterial 保持环境反射与薄膜色散（外环偏暗、偏玻璃）
 */
function createTorus(): {
  group: THREE.Group
  letterK: THREE.Mesh
  disposeLetterK: () => void
} {
  const group = new THREE.Group()

  // 外六边形环（替代 TorusGeometry）
  const outerPath = createHexRingPath(0.48)
  const outerTubeGeo = new THREE.TubeGeometry(outerPath, 288, 0.065, 24, true)
  const torusMat = new THREE.MeshPhysicalMaterial({
    color: 0xe8eeff,
    metalness: 0.04,
    roughness: 0.12,
    transmission: 0.78,
    thickness: 0.5,
    transparent: true,
    opacity: 0.9,
    iridescence: 0.38,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [120, 420],
    envMapIntensity: 0.55,
  })
  const torus = new THREE.Mesh(outerTubeGeo, torusMat)
  group.add(torus)

  // 中心玻璃字 K（Helvetiker Bold；挂到 scene，朝向由 updateScene billboard）
  const fontLoader = new FontLoader()
  const font = fontLoader.parse(
    helvetikerBoldFont as Parameters<FontLoader['parse']>[0],
  )
  const letterGeo = new TextGeometry('K', {
    font,
    size: 0.26,
    depth: 0.07,
    curveSegments: 10,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.006,
    bevelSegments: 2,
  })
  letterGeo.center()
  const letterMat = new THREE.MeshPhysicalMaterial({
    color: 0xb8d4ff,
    metalness: 0.02,
    roughness: 0.06,
    transmission: 0.93,
    thickness: 0.45,
    transparent: true,
    ior: 1.45,
    emissive: 0x224466,
    emissiveIntensity: 0.42,
    envMapIntensity: 0.65,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
  })
  const letterK = new THREE.Mesh(letterGeo, letterMat)

  function disposeLetterK() {
    letterGeo.dispose()
    letterMat.dispose()
  }

  return { group, letterK, disposeLetterK }
}

export function useThreeScene(canvas: HTMLCanvasElement): ThreeContext {
  // ── 渲染器 ──────────────────────────────────────────────
  // 透明 WebGL：清屏 alpha=0；页面底色由 main.css 的 html/body 提供（深色，不抢透明主体）
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  // ── 场景 ────────────────────────────────────────────────
  const scene = new THREE.Scene()
  scene.background = null

  // ── 环境贴图（让 MeshPhysicalMaterial 反射正常工作） ────
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  const roomEnv = new RoomEnvironment()
  const envTexture = pmremGenerator.fromScene(roomEnv).texture
  scene.environment = envTexture
  pmremGenerator.dispose()
  roomEnv.dispose()

  // ── 相机 ────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.01,
    100,
  )
  camera.position.set(0, 0.2, 3.5)

  // ── 灯光 ────────────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0xf2f4f8, 0.22)
  scene.add(ambientLight)

  // 主光自下方抬起（负 Y），配合略低的环境光避免玻璃过曝
  const breathLight = new THREE.PointLight(0x5577ff, 3.2, 8)
  breathLight.position.set(0.15, -1.35, 1.8)
  scene.add(breathLight)

  const sideLight = new THREE.PointLight(0x33ddcc, 1.2, 6)
  sideLight.position.set(1.6, -0.95, 0.4)
  scene.add(sideLight)

  const rimLow = new THREE.PointLight(0x6688ff, 0.85, 5)
  rimLow.position.set(-1.2, -0.7, -0.6)
  scene.add(rimLow)

  // ── 主角几何体 ──────────────────────────────────────────
  const { group: torusGroup, letterK, disposeLetterK } = createTorus()
  torusGroup.position.set(0, 0, 0)
  scene.add(torusGroup)
  scene.add(letterK)

  // ── 后处理（辉光） ──────────────────────────────────────
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.38,  // strength
    0.42,  // radius
    0.92,  // threshold — 主要让高亮（字 K、粒子等）起辉光
  )
  composer.addPass(bloomPass)
  composer.addPass(new OutputPass())

  // ── 时钟 ────────────────────────────────────────────────
  const clock = new THREE.Clock()

  // ── 响应窗口 resize ─────────────────────────────────────
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    composer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)

  // ── 清理函数 ────────────────────────────────────────────
  function dispose() {
    window.removeEventListener('resize', onResize)
    scene.remove(letterK)
    disposeLetterK()
    renderer.dispose()
    composer.dispose()
    envTexture.dispose()
  }

  return {
    renderer,
    scene,
    camera,
    composer,
    torusGroup,
    letterK,
    clock,
    dispose,
  }
}

/**
 * 每帧更新：呼吸灯 + 圆环自转
 * 由 ThreeScene.vue 的动画循环调用
 */
export function updateScene(
  ctx: ThreeContext,
  elapsedTime: number,
) {
  const { scene, camera, torusGroup, letterK } = ctx

  // 圆环缓慢自转
  torusGroup.rotation.y += 0.003
  torusGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.05

  torusGroup.updateMatrixWorld(true)
  _letterWorldScratch.copy(LETTER_LOCAL).applyMatrix4(torusGroup.matrixWorld)
  letterK.position.copy(_letterWorldScratch)
  letterK.quaternion.copy(camera.quaternion)

  // 呼吸灯：用 sin 驱动主点光源强度（下方蓝色 key）
  const breathLight = scene.children.find(
    (c) => c instanceof THREE.PointLight && (c as THREE.PointLight).color.b > 0.5
  ) as THREE.PointLight | undefined

  if (breathLight) {
    breathLight.intensity = 2.6 + Math.sin(elapsedTime * 2.0) * 1.2
  }
}
