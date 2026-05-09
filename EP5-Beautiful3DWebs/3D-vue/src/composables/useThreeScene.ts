/**
 * useThreeScene
 * 负责创建和管理 Three.js 场景的核心对象：
 *   - WebGLRenderer（渲染器）
 *   - PerspectiveCamera（透视相机）
 *   - Scene（场景）
 *   - 环境光/点光源
 *   - 主角几何体（虹彩圆环 + 交叉线缆）
 *   - 后处理（UnrealBloomPass 辉光）
 *   - 渲染循环（requestAnimationFrame）
 */

import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
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
  clock: THREE.Clock
  dispose: () => void
}

/**
 * 创建由两条贝塞尔曲线组成的交叉线缆（X 形）
 */
function createWires(): THREE.Group {
  const group = new THREE.Group()

  const wireMat = new THREE.MeshPhysicalMaterial({
    color: 0x888888,
    metalness: 0.9,
    roughness: 0.15,
    transmission: 0.2,
  })

  // 两条交叉的曲线路径（左下→右下，右下→左下，形成 X）
  const curveConfigs = [
    [
      new THREE.Vector3(-0.25, -0.18, 0.05),
      new THREE.Vector3(0.0, -0.7, 0.1),
      new THREE.Vector3(0.5, -1.4, -0.05),
    ],
    [
      new THREE.Vector3(0.25, -0.18, -0.05),
      new THREE.Vector3(0.0, -0.7, -0.1),
      new THREE.Vector3(-0.5, -1.4, 0.05),
    ],
  ]

  for (const points of curveConfigs) {
    const curve = new THREE.CatmullRomCurve3(points)
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.006, 8, false)
    const mesh = new THREE.Mesh(tubeGeo, wireMat)
    group.add(mesh)
  }

  return group
}

/**
 * 创建虹彩圆环（Iridescent Torus）
 * 使用 MeshPhysicalMaterial 的 iridescence 参数模拟薄膜干涉
 */
function createTorus(): THREE.Group {
  const group = new THREE.Group()

  // 外圆环
  const torusGeo = new THREE.TorusGeometry(0.48, 0.065, 64, 256)
  const torusMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.6,
    thickness: 0.5,
    iridescence: 1.0,
    iridescenceIOR: 1.5,
    iridescenceThicknessRange: [100, 600],
    envMapIntensity: 3.0,
  })
  const torus = new THREE.Mesh(torusGeo, torusMat)
  group.add(torus)

  // 内层装饰环（略小，金属感）
  const innerGeo = new THREE.TorusGeometry(0.34, 0.012, 32, 128)
  const innerMat = new THREE.MeshPhysicalMaterial({
    color: 0x6688cc,
    metalness: 1.0,
    roughness: 0.1,
    iridescence: 0.5,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [200, 500],
    envMapIntensity: 2.0,
  })
  const inner = new THREE.Mesh(innerGeo, innerMat)
  group.add(inner)

  // 中心 Logo 盘（六边形平面）
  const logoGeo = new THREE.CircleGeometry(0.22, 6)
  const logoMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e,
    metalness: 0.6,
    roughness: 0.3,
    transmission: 0.1,
    envMapIntensity: 1.5,
  })
  const logo = new THREE.Mesh(logoGeo, logoMat)
  logo.position.z = 0.01
  group.add(logo)

  return group
}

export function useThreeScene(canvas: HTMLCanvasElement): ThreeContext {
  // ── 渲染器 ──────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2

  // ── 场景 ────────────────────────────────────────────────
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x020408)
  scene.fog = new THREE.FogExp2(0x020408, 0.15)

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
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  // 蓝色点光源（呼吸灯的主光）
  const breathLight = new THREE.PointLight(0x4466ff, 4, 6)
  breathLight.position.set(0, 0.5, 2)
  scene.add(breathLight)

  // 青色点光源（侧面补光）
  const sideLight = new THREE.PointLight(0x00ffcc, 2, 5)
  sideLight.position.set(2, 0, 1)
  scene.add(sideLight)

  // ── 主角几何体 ──────────────────────────────────────────
  const torusGroup = createTorus()
  torusGroup.position.set(0, 0, 0)
  scene.add(torusGroup)

  const wireGroup = createWires()
  wireGroup.position.set(0, -0.48, 0)
  scene.add(wireGroup)

  // ── 后处理（辉光） ──────────────────────────────────────
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8,   // strength
    0.5,   // radius
    0.7,   // threshold
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
    renderer.dispose()
    composer.dispose()
    envTexture.dispose()
  }

  return { renderer, scene, camera, composer, torusGroup, clock, dispose }
}

/**
 * 每帧更新：呼吸灯 + 圆环自转
 * 由 ThreeScene.vue 的动画循环调用
 */
export function updateScene(
  ctx: ThreeContext,
  elapsedTime: number,
) {
  const { scene, torusGroup } = ctx

  // 圆环缓慢自转
  torusGroup.rotation.y += 0.003
  torusGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.05

  // 呼吸灯：用 sin 驱动点光源强度（周期约 3 秒）
  const breathLight = scene.children.find(
    (c) => c instanceof THREE.PointLight && (c as THREE.PointLight).color.b > 0.5
  ) as THREE.PointLight | undefined

  if (breathLight) {
    breathLight.intensity = 3 + Math.sin(elapsedTime * 2.0) * 2
  }
}
