import {
  BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial,
  Quaternion, TorusGeometry, Vector3,
} from 'three'

const up = new Vector3(0, 1, 0)

export function buildWheelchair() {
  const model = new Group()
  const steel = new MeshStandardMaterial({ color: '#a9c6ce', metalness: .62, roughness: .29 })
  const frame = new MeshStandardMaterial({ color: '#41b1a4', metalness: .28, roughness: .28 })
  const rubber = new MeshStandardMaterial({ color: '#292e35', roughness: .72 })
  const fabric = new MeshStandardMaterial({ color: '#203f50', roughness: .92 })
  const trim = new MeshStandardMaterial({ color: '#6b939d', roughness: .65 })

  function mesh(geometry, material, x, y, z) {
    const part = new Mesh(geometry, material)
    part.position.set(x, y, z)
    model.add(part)
    return part
  }

  function tube(a, b, radius, material) {
    const from = new Vector3(...a)
    const to = new Vector3(...b)
    const direction = to.clone().sub(from)
    const middle = from.addScaledVector(direction, .5)
    const pipe = mesh(new CylinderGeometry(radius, radius, direction.length(), 10), material, ...middle)
    pipe.quaternion.copy(new Quaternion().setFromUnitVectors(up, direction.normalize()))
    return pipe
  }

  const box = (w, h, d, x, y, z, material) => mesh(new BoxGeometry(w, h, d), material, x, y, z)

  function ring(radius, thickness, material, x, y, z) {
    const rim = mesh(new TorusGeometry(radius, thickness, 9, 48), material, x, y, z)
    rim.rotation.y = Math.PI / 2
  }

  for (const side of [-1, 1]) {
    const x = side * .79
    ring(.79, .066, rubber, x, .85, -.49)
    ring(.72, .036, steel, x, .85, -.49)
    ring(.66, .023, steel, x + side * .09, .85, -.49)
    tube([x - .09, .85, -.49], [x + .09, .85, -.49], .085, frame)
    for (let i = 0; i < 14; i++) {
      const angle = i * Math.PI / 7
      tube([x, .85, -.49], [x, .85 + Math.cos(angle) * .7, -.49 + Math.sin(angle) * .7], .012, steel)
    }

    const leg = side * .59
    tube([leg, .48, -.51], [leg, 1.39, -.55], .046, frame)
    tube([leg, 1.41, -.56], [leg, 2.49, -.78], .044, frame)
    tube([leg, 2.48, -.78], [leg, 2.48, -1.08], .055, rubber)
    tube([leg, 1.41, -.55], [leg, 1.40, .71], .045, frame)
    tube([leg, .5, -.49], [leg, .5, .82], .044, frame)
    tube([leg, .5, .65], [leg, 1.38, .73], .04, frame)
    tube([leg, 1.65, -.58], [leg, 1.65, .50], .032, steel)
    tube([leg, 1.65, .44], [leg, 1.42, .44], .034, steel)
    box(.15, .075, .8, leg, 1.70, -.035, rubber)
    tube([leg, 1.40, .72], [leg, .37, 1.10], .038, steel)
    box(.45, .065, .39, side * .34, .34, 1.16, rubber)
    box(.36, .012, .26, side * .34, .38, 1.16, trim)
    tube([leg, .53, .80], [leg, .25, .88], .048, frame)
    ring(.19, .045, rubber, leg, .235, .88)
    ring(.115, .022, steel, leg, .235, .88)
    tube([leg - .045, .235, .88], [leg + .045, .235, .88], .075, frame)
    tube([leg, 1.34, .35], [side * .78, 1.53, .37], .03, steel)
    tube([side * .77, 1.51, .37], [side * .84, 1.63, .44], .037, rubber)
  }
  tube([-.58, .54, -.40], [.58, 1.28, .62], .033, steel)
  tube([.58, .54, -.40], [-.58, 1.28, .62], .033, steel)
  tube([-.58, 2.28, -.75], [.58, 2.28, -.75], .041, frame)
  box(1.16, .115, 1.24, 0, 1.44, .01, fabric)
  box(1.08, .012, .05, 0, 1.51, .56, trim)
  const back = box(1.12, .83, .11, 0, 1.99, -.63, fabric)
  back.rotation.x = -.19
  const seam = box(1.04, .022, .012, 0, 2.27, -.63, trim)
  seam.rotation.x = -.19

  return {
    model,
    anchors: {
      backrest: new Vector3(.20, 2.25, -.40),
      wheel: new Vector3(.94, .75, -.12),
      brake: new Vector3(.87, 1.67, .43),
      footrest: new Vector3(-.32, .43, 1.38),
    },
  }
}
