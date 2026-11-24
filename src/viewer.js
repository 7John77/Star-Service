import { tr } from './locale.js'
import {
  ACESFilmicToneMapping, AmbientLight, BoxGeometry, CanvasTexture, CatmullRomCurve3, Color,
  CylinderGeometry, DirectionalLight, Group, HemisphereLight, LatheGeometry, MathUtils,
  Mesh, MeshStandardMaterial, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace,
  TorusGeometry, TubeGeometry, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createSoftwareRenderer } from './software-viewer.js'

const specs = {
  powder: { radius: .51, height: 2.33 },
  co2: { radius: .40, height: 2.49, horn: true },
  foam: { radius: .54, height: 2.45 },
  wet: { radius: .48, height: 2.45, wand: true },
}

function material(color, roughness, metalness = 0) {
  return new MeshStandardMaterial({ color, roughness, metalness })
}

function labelTexture(artwork) {
  const canvas = document.createElement('canvas')
  canvas.width = artwork.naturalWidth
  canvas.height = artwork.naturalHeight
  canvas.getContext('2d').drawImage(artwork, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function buildModel(type, texture) {
  const spec = specs[type]
  const { radius, height } = spec
  const model = new Group()
  const coating = material('#d31e20', .23, .29)
  const rubber = material('#18191d', .40)
  const matte = material('#242329', .29, .35)
  const steel = material('#b1a7a0', .28, .85)
  const brass = material('#b6966f', .30, .63)
  function item(geometry, surface, position, rotation) {
    const mesh = new Mesh(geometry, surface)
    mesh.position.set(...position)
    if (rotation) mesh.rotation.set(...rotation)
    model.add(mesh)
    return mesh
  }
  const profile = [
    [0, .06], [.76, .06], [.94, .08], [1, .17], [1, height - .47],
    [.995, height - .33], [.96, height - .25], [.87, height - .17], [.71, height - .105],
    [.47, height - .043], [.28, height], [.20, height + .045], [0, height + .045],
  ].map(([x,y]) => new Vector2(x * radius, y))
  item(new LatheGeometry(profile, 96), coating, [0, 0, 0])
  item(new CylinderGeometry(radius * 1.015, radius * .92, .13, 64), rubber, [0, .10, 0])
  item(new TorusGeometry(radius * .984, .014, 14, 80), matte, [0, .164, 0], [Math.PI / 2, 0, 0])
  item(new CylinderGeometry(radius * .30, radius * .35, .135, 32), coating, [0, height + .045, 0])
  item(new CylinderGeometry(.145, .135, .10, 12), brass, [0, height + .15, 0])
  item(new CylinderGeometry(.105, .133, .22, 24), brass, [0, height + .25, 0])
  item(new BoxGeometry(.15, .055, .33, 2), steel, [0, height + .367, -.07], [-.087, 0, 0])
  item(new BoxGeometry(.15, .07, .49, 3), matte, [0, height + .335, -.19], [.08, 0, 0])
  item(new BoxGeometry(.135, .063, .48, 3), matte, [0, height + .47, -.20], [.29, 0, 0])
  item(new CylinderGeometry(.075, .075, .085, 24), steel, [0, height + .355, .041], [Math.PI / 2, 0, 0])
  item(new TorusGeometry(.082, .012, 16, 42), steel, [-.105, height + .355, .11], [0, -.28, 0])
  if (type !== 'co2') {
    const bezel = new CylinderGeometry(.105, .094, .06, 32)
    item(bezel, steel, [0, height + .207, .14], [Math.PI / 2, 0, 0])
    item(new CylinderGeometry(.083, .083, .009, 36), material('#b7bd9f', .63), [0, height + .207, .174], [Math.PI / 2, 0, 0])
    item(new BoxGeometry(.08, .013, .006), matte, [0, height + .205, .179], [0, 0, .62])
  }

  const label = new MeshStandardMaterial({ map: texture, roughness: .76 })
  const labelRadius = radius + .006
  const labelHeight = 1.24
  const labelArc = labelHeight * texture.image.width / texture.image.height / labelRadius
  item(new CylinderGeometry(labelRadius, labelRadius, labelHeight, 48, 1, true, -labelArc / 2, labelArc), label, [0, 1.23, 0])
  item(new CylinderGeometry(.06, .055, .16, 16), steel, [radius * .42, height + .245, -.035], [0, 0, Math.PI / 2])

  const side = radius + (spec.horn ? .30 : .21)
  const end = spec.horn ? 1.84 : spec.wand ? 1.68 : .69
  const outlet = [side + .008, end, .16]
  const curve = new CatmullRomCurve3([
    new Vector3(radius * .49, height + .25, -.036),
    new Vector3(side - .11, height + .2, -.05),
    new Vector3(side, height + .025, .005),
    new Vector3(side + .045, Math.max(end + .14, height - .5), .12),
    new Vector3(...outlet),
  ])
  item(new TubeGeometry(curve, 48, spec.horn ? .055 : .042, 14), rubber, [0, 0, 0])
  if (spec.horn) {
    item(new CylinderGeometry(.048, .185, .58, 48, 1, true), matte, [outlet[0] + .056, end - .285, .16], [0, 0, .19])
    item(new TorusGeometry(.185, .014, 12, 42), rubber, [outlet[0] + .11, end - .57, .16], [Math.PI / 2, .19, 0])
    item(new CylinderGeometry(.045, .045, .02, 36), rubber, [outlet[0] + .10, end - .52, .16])
  } else if (spec.wand) {
    item(new CylinderGeometry(.034, .034, .77, 20), steel, [outlet[0], end - .38, .16])
    item(new CylinderGeometry(.046, .061, .14, 20), matte, [outlet[0], end - .80, .16])
  } else {
    item(new CylinderGeometry(.048, .073, .24, 24), matte, [outlet[0], end - .11, .16])
  }

  const anchors = {
    label: new Vector3(-.29, 1.24, radius * .92),
    valve: new Vector3(-.06, height + .34, .17),
    outlet: new Vector3(outlet[0] + .055, end - .18, .20),
  }
  return { model, anchors }
}

export function openViewer(surface, artwork, onPart, onSpinChange) {
  const texture = labelTexture(artwork)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const options = { alpha: true, antialias: true }
  let canvas = document.createElement('canvas')
  let context = canvas.getContext('webgl2', options)
  let renderer
  if (context) {
    try {
      renderer = new WebGLRenderer({ ...options, canvas, context })
    } catch {
      context = null
      canvas = document.createElement('canvas')
    }
  }
  renderer ||= createSoftwareRenderer(canvas)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  surface.append(renderer.domElement)

  const scene = new Scene()
  const camera = new PerspectiveCamera(34, 1, .1, 40)
  if (context) {
    renderer.setClearColor(0, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    const pmrem = new PMREMGenerator(renderer)
    const studio = new RoomEnvironment()
    const environment = pmrem.fromScene(studio, .055)
    scene.environment = environment.texture
    scene.environmentIntensity = .67
    studio.dispose()
    pmrem.dispose()
    scene.add(new AmbientLight(0xffede3, .43))
    scene.add(new HemisphereLight(0xfff3e6, 0x492424, 1.25))
    for (const [color, intensity, position] of [
      [0xffe0d1, 3.2, [-3, 5, 6]],
      [0xff3330, 2.3, [3, 4, -3]],
      [0xfff3eb, 1.25, [5, 5, 2]],
    ]) {
      const light = new DirectionalLight(new Color(color), intensity)
      light.position.set(...position)
      scene.add(light)
    }
  }

  const pins = {}
  for (const [part, title] of Object.entries({ label: tr('Ετικέτα', 'Label'), valve: tr('Βαλβίδα', 'Valve'), outlet: tr('Ακροφύσιο', 'Nozzle') })) {
    const pin = document.createElement('button')
    pin.type = 'button'
    pin.className = 'model-pin'
    pin.setAttribute('aria-label', title)
    pin.title = title
    pin.textContent = '+'
    pin.addEventListener('click', () => onPart(part))
    surface.append(pin)
    pins[part] = pin
  }

  const frontAngle = -.12
  const fullTurn = Math.PI * 2
  let current, spin
  let target = frontAngle, rotation = -.95
  let zoom = 1, targetZoom = 1
  let width = 1, height = 1, frame = 0, dragging = false, position = 0
  let lastMovement = 0, velocity = 0
  const projected = new Vector3()
  const models = new Map()
  const pinEntries = Object.entries(pins)

  function stopSpin() {
    if (!spin) return
    spin = undefined
    target = rotation
    onSpinChange(false)
  }

  function align(angle) {
    target = rotation + MathUtils.euclideanModulo(angle - rotation + Math.PI, fullTurn) - Math.PI
  }

  function draw(time) {
    frame = 0
    if (spin) {
      const progress = Math.min((time - spin.start) / 3100, 1)
      const eased = progress * progress * (3 - 2 * progress)
      rotation = spin.from + fullTurn * eased
      if (progress === 1) stopSpin()
    } else {
      rotation += (target - rotation) * (reduce || dragging ? 1 : .18)
      if (Math.abs(target - rotation) < .002) rotation = target
    }
    if (zoom !== targetZoom) {
      zoom += (targetZoom - zoom) * (reduce ? 1 : .19)
      if (Math.abs(targetZoom - zoom) < .001) zoom = targetZoom
      camera.zoom = zoom
      camera.updateProjectionMatrix()
    }
    current.model.rotation.y = rotation
    current.model.updateMatrixWorld()
    renderer.render(scene, camera)
    surface.classList.remove('is-preview')
    for (const [part, pin] of pinEntries) {
      projected.copy(current.anchors[part])
      current.model.localToWorld(projected)
      const behind = projected.z < -.17 && part !== 'valve'
      projected.project(camera)
      const x = (projected.x + 1) * width / 2
      const y = (1 - projected.y) * height / 2
      pin.hidden = behind || y < 24 || y > height - 20
      pin.style.left = x + (part === 'label' ? -24 : part === 'outlet' ? 19 : -16) + 'px'
      pin.style.top = y + 'px'
    }
    if (spin || target !== rotation || targetZoom !== zoom) schedule()
  }

  function schedule() {
    if (!frame && current) frame = requestAnimationFrame(draw)
  }

  function resize() {
    width = Math.max(surface.clientWidth, 1)
    height = Math.max(surface.clientHeight, 1)
    camera.aspect = width / height
    camera.position.set(0, 1.82, 6.02 / Math.min(1, camera.aspect / .88))
    camera.lookAt(.03, 1.49, 0)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    schedule()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(surface)
  resize()

  canvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return
    stopSpin()
    target = rotation
    dragging = true
    position = event.clientX
    lastMovement = event.timeStamp
    velocity = 0
    canvas.setPointerCapture(event.pointerId)
    surface.classList.add('is-dragging')
  })
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging || !event.isPrimary) return
    const difference = (event.clientX - position) * fullTurn / Math.max(width * .82, 245)
    velocity = difference / Math.max(event.timeStamp - lastMovement, 8)
    target += difference
    position = event.clientX
    lastMovement = event.timeStamp
    schedule()
  })
  canvas.addEventListener('pointerup', (event) => {
    if (dragging && !reduce && event.timeStamp - lastMovement < 85) {
      target += MathUtils.clamp(velocity * 105, -.8, .8)
      schedule()
    }
  })
  canvas.addEventListener('lostpointercapture', () => {
    dragging = false
    surface.classList.remove('is-dragging')
  })
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    stopSpin()
    cancelAnimationFrame(frame)
    observer.disconnect()
    surface.dispatchEvent(new Event('viewerunavailable'))
  })

  return {
    set(type) {
      stopSpin()
      if (current) scene.remove(current.model)
      if (!models.has(type)) models.set(type, buildModel(type, texture))
      current = models.get(type)
      scene.add(current.model)
      align(frontAngle)
      rotation = target - (reduce ? 0 : .65)
      for (const [, pin] of pinEntries) pin.classList.remove('active')
      schedule()
    },
    turn(direction) {
      stopSpin()
      target += direction * Math.PI / 3
      schedule()
    },
    spin() {
      if (spin) {
        stopSpin()
      } else {
        spin = { from: rotation, start: performance.now() }
        onSpinChange(true)
      }
      schedule()
    },
    zoom(enabled) {
      targetZoom = enabled ? 1.23 : 1
      schedule()
    },
    reset() {
      stopSpin()
      align(frontAngle)
      targetZoom = 1
      for (const [, pin] of pinEntries) pin.classList.remove('active')
      schedule()
    },
    focus(part) {
      stopSpin()
      align({ valve: -.10, outlet: -.65, label: .05 }[part])
      for (const [name, pin] of pinEntries) pin.classList.toggle('active', name === part)
      schedule()
    },
  }
}
