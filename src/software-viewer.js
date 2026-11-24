import { Matrix3, Matrix4, Vector3 } from 'three'

const projected = new Matrix4()
const normalMatrix = new Matrix3()
const direction = new Vector3()
const view = new Vector3(0, .04, 1).normalize()
const lighting = [
  { vector: new Vector3(-.48, .57, .68).normalize(), diffuse: .65, specular: .56 },
  { vector: new Vector3(.80, .32, .27).normalize(), diffuse: .36, specular: .43 },
]
for (const light of lighting) light.half = light.vector.clone().add(view).normalize()

function createGeometry(mesh) {
  const geometry = mesh.geometry
  const { position, normal, uv } = geometry.attributes
  const material = mesh.material
  const color = material.color.clone().convertLinearToSRGB().toArray().map((value) => value * 255)
  let texture = material.map?.image
  if (texture && texture.width > 320) {
    // Preserve fine print while filtering the source at a practical size.
    const sample = document.createElement('canvas')
    sample.width = 320
    sample.height = Math.round(texture.height * sample.width / texture.width)
    const context = sample.getContext('2d')
    context.imageSmoothingQuality = 'high'
    context.drawImage(texture, 0, 0, sample.width, sample.height)
    texture = sample
  }
  const pixels = texture?.getContext('2d').getImageData(0, 0, texture.width, texture.height).data
  return {
    color, pixels, texture, textureVersion: material.map?.version, indices: geometry.index.array, position, normal, uv,
    points: new Float32Array(position.count * 4),
    diffuse: new Float32Array(position.count),
    gloss: new Float32Array(position.count),
    shine: material.roughness < .35 ? 24 : 12,
    unlit: material.isMeshBasicMaterial,
  }
}

function transform(shape, mesh, camera, width, height) {
  const { position, normal, points, diffuse, gloss, shine } = shape
  projected.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(mesh.matrixWorld)
  normalMatrix.getNormalMatrix(mesh.matrixWorld)
  const m = projected.elements
  const n = normalMatrix.elements
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i)
    const inverseW = 1 / (m[3] * x + m[7] * y + m[11] * z + m[15])
    const offset = i * 4
    points[offset] = (1 + (m[0] * x + m[4] * y + m[8] * z + m[12]) * inverseW) * width / 2
    points[offset + 1] = (1 - (m[1] * x + m[5] * y + m[9] * z + m[13]) * inverseW) * height / 2
    points[offset + 2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) * inverseW
    points[offset + 3] = inverseW
    const nx = normal.getX(i), ny = normal.getY(i), nz = normal.getZ(i)
    direction.set(
      n[0] * nx + n[3] * ny + n[6] * nz,
      n[1] * nx + n[4] * ny + n[7] * nz,
      n[2] * nx + n[5] * ny + n[8] * nz,
    ).normalize()
    let light = .49 + .15 * Math.max(direction.y, 0)
    let specular = 0
    for (const source of lighting) {
      light += Math.max(direction.dot(source.vector), 0) * source.diffuse
      specular += Math.max(direction.dot(source.half), 0) ** shine * source.specular
    }
    diffuse[i] = light
    gloss[i] = specular * 195
  }
}

function rasterize(shape, rgba, depth, width, height) {
  const { color, pixels, texture, position, indices, uv, points, diffuse, gloss, unlit } = shape
  for (let t = 0; t < indices.length; t += 3) {
    const i = indices[t], j = indices[t + 1], k = indices[t + 2]
    if (i >= position.count || j >= position.count || k >= position.count) continue
    const a = i * 4, b = j * 4, c = k * 4
    const ax = points[a], ay = points[a + 1]
    const bx = points[b], by = points[b + 1]
    const cx = points[c], cy = points[c + 1]
    const determinant = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    if (determinant >= -.0001) continue
    const left = Math.max(0, Math.floor(Math.min(ax, bx, cx)))
    const right = Math.min(width - 1, Math.ceil(Math.max(ax, bx, cx)))
    const top = Math.max(0, Math.floor(Math.min(ay, by, cy)))
    const bottom = Math.min(height - 1, Math.ceil(Math.max(ay, by, cy)))
    const waX = (by - cy) / determinant, waY = (cx - bx) / determinant
    const wbX = (cy - ay) / determinant, wbY = (ax - cx) / determinant
    for (let y = top; y <= bottom; y++) {
      let wa = waX * (left + .5 - cx) + waY * (y + .5 - cy)
      let wb = wbX * (left + .5 - cx) + wbY * (y + .5 - cy)
      for (let x = left; x <= right; x++, wa += waX, wb += wbX) {
        const wc = 1 - wa - wb
        if (Math.min(wa, wb, wc) < -.00001) continue
        const z = wa * points[a + 2] + wb * points[b + 2] + wc * points[c + 2]
        const pixel = y * width + x
        if (z >= depth[pixel]) continue
        depth[pixel] = z
        const light = wa * diffuse[i] + wb * diffuse[j] + wc * diffuse[k]
        const d = unlit ? .88 + .12 * Math.min(light, 1) : light
        const s = unlit ? 0 : wa * gloss[i] + wb * gloss[j] + wc * gloss[k]
        let r = color[0], g = color[1], bColor = color[2]
        if (pixels) {
          const pa = wa * points[a + 3], pb = wb * points[b + 3], pc = wc * points[c + 3]
          const total = pa + pb + pc
          const u = (pa * uv.getX(i) + pb * uv.getX(j) + pc * uv.getX(k)) / total
          const v = (pa * uv.getY(i) + pb * uv.getY(j) + pc * uv.getY(k)) / total
          const tx = Math.max(0, Math.min(texture.width - 1, u * texture.width - .5))
          const ty = Math.max(0, Math.min(texture.height - 1, (1 - v) * texture.height - .5))
          const left = Math.floor(tx), top = Math.floor(ty)
          const right = Math.min(left + 1, texture.width - 1)
          const bottom = Math.min(top + 1, texture.height - 1)
          const xWeight = tx - left, yWeight = ty - top
          const tl = (top * texture.width + left) * 4
          const tr = (top * texture.width + right) * 4
          const bl = (bottom * texture.width + left) * 4
          const br = (bottom * texture.width + right) * 4
          const topLeftWeight = (1 - xWeight) * (1 - yWeight)
          const topRightWeight = xWeight * (1 - yWeight)
          const bottomLeftWeight = (1 - xWeight) * yWeight
          const bottomRightWeight = xWeight * yWeight
          r = pixels[tl] * topLeftWeight + pixels[tr] * topRightWeight + pixels[bl] * bottomLeftWeight + pixels[br] * bottomRightWeight
          g = pixels[tl + 1] * topLeftWeight + pixels[tr + 1] * topRightWeight + pixels[bl + 1] * bottomLeftWeight + pixels[br + 1] * bottomRightWeight
          bColor = pixels[tl + 2] * topLeftWeight + pixels[tr + 2] * topRightWeight + pixels[bl + 2] * bottomLeftWeight + pixels[br + 2] * bottomRightWeight
        }
        const offset = pixel * 4
        rgba[offset] = r * d + s
        rgba[offset + 1] = g * d + s * .79
        rgba[offset + 2] = bColor * d + s * .73
        rgba[offset + 3] = 255
      }
    }
  }
}

export function createSoftwareRenderer(domElement, compact = false) {
  const ctx = domElement.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  const shapes = new WeakMap()
  let displayWidth, displayHeight
  let width, height, image, depth, moving
  return {
    domElement,
    setSize(nextWidth, nextHeight) {
      displayWidth = nextWidth
      displayHeight = nextHeight
      image = undefined
    },
    render(scene, camera, inMotion = false) {
      if (!image || moving !== inMotion) {
        moving = inMotion
        const maxSize = compact ? (moving ? 330 : 660) : (moving ? 580 : 1120)
        const scale = Math.min(moving ? 1 : 1.6, maxSize / Math.max(displayWidth, displayHeight))
        width = Math.max(1, Math.round(displayWidth * scale))
        height = Math.max(1, Math.round(displayHeight * scale))
        domElement.width = width
        domElement.height = height
        image = ctx.createImageData(width, height)
        depth = new Float32Array(width * height)
      }
      scene.updateMatrixWorld()
      camera.updateMatrixWorld()
      depth.fill(Infinity)
      image.data.fill(0)
      scene.traverse((mesh) => {
        if (!mesh.isMesh) return
        let shape = shapes.get(mesh)
        if (!shape || shape.textureVersion !== mesh.material.map?.version) {
          shape = createGeometry(mesh)
          shapes.set(mesh, shape)
        }
        transform(shape, mesh, camera, width, height)
        rasterize(shape, image.data, depth, width, height)
      })
      ctx.putImageData(image, 0, 0)
    },
  }
}
