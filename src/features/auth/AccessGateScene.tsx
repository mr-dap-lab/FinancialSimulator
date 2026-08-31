import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

/** The blue/gold accent tones the background image itself uses. */
const BLUE = new THREE.Color('#6ea8ff')
const GOLD = new THREE.Color('#ffc46b')

const PARTICLE_COUNT = 220

function buildParticles(): THREE.Points {
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  const sizes = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16
    positions[i * 3 + 1] = (Math.random() - 0.5) * 9
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8

    const tone = Math.random() < 0.6 ? BLUE : GOLD
    const shade = 0.6 + Math.random() * 0.4
    colors[i * 3] = tone.r * shade
    colors[i * 3 + 1] = tone.g * shade
    colors[i * 3 + 2] = tone.b * shade

    sizes[i] = 0.03 + Math.random() * 0.06
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })

  return new THREE.Points(geometry, material)
}

/**
 * A slow-drifting field of blue/gold particles layered over the gate's
 * background image (see `AccessGate.tsx`) — a light, decorative touch on top
 * of the static hero image, not an attempt to recreate its whole 3D scene.
 *
 * Purely decorative: `aria-hidden`, `pointer-events: none`, and it fails
 * silently (rendering nothing) wherever WebGL isn't available rather than
 * throwing — the static background image alone is a complete fallback.
 */
export function AccessGateScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    camera.position.z = 6

    const points = buildParticles()
    scene.add(points)

    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container
      if (width === 0 || height === 0) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    resize()

    let frameId = 0
    const start = performance.now()
    const renderFrame = (now: number) => {
      const elapsed = (now - start) / 1000
      points.rotation.y = elapsed * 0.02
      points.rotation.x = Math.sin(elapsed * 0.08) * 0.05
      renderer.render(scene, camera)
      if (!reducedMotion) frameId = requestAnimationFrame(renderFrame)
    }
    renderFrame(start)

    window.addEventListener('resize', resize)

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      points.geometry.dispose()
      ;(points.material as THREE.Material).dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [reducedMotion])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden [&>canvas]:h-full [&>canvas]:w-full"
    />
  )
}
