import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export const ThreeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 24

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 50)
    pointLight.position.set(10, 10, 15)
    scene.add(pointLight)

    const secondaryLight = new THREE.PointLight(0x10b981, 1.5, 40)
    secondaryLight.position.set(-10, -10, 10)
    scene.add(secondaryLight)

    // 3D Spatial Chrono Kinetic Ring Group
    const chronoGroup = new THREE.Group()

    // Outer Torus Ring
    const torusGeo1 = new THREE.TorusGeometry(8.5, 0.03, 16, 100)
    const torusMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.25,
    })
    const ring1 = new THREE.Mesh(torusGeo1, torusMat1)
    chronoGroup.add(ring1)

    // Middle Gimbal Ring
    const torusGeo2 = new THREE.TorusGeometry(6.2, 0.04, 16, 80)
    const torusMat2 = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      roughness: 0.3,
      metalness: 0.9,
      transparent: true,
      opacity: 0.2,
    })
    const ring2 = new THREE.Mesh(torusGeo2, torusMat2)
    ring2.rotation.x = Math.PI / 4
    chronoGroup.add(ring2)

    // Core Wireframe Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(3.2, 1)
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    })
    const icosahedron = new THREE.Mesh(icoGeo, icoMat)
    chronoGroup.add(icosahedron)

    // Inner Floating Crystal Octahedron
    const octGeo = new THREE.OctahedronGeometry(1.6, 0)
    const octMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.22,
    })
    const octahedron = new THREE.Mesh(octGeo, octMat)
    chronoGroup.add(octahedron)

    // Ambient Starfield Constellation Particles
    const particleCount = 200
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 45
      positions[i + 1] = (Math.random() - 0.5) * 35
      positions[i + 2] = (Math.random() - 0.5) * 25
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.08,
      transparent: true,
      opacity: 0.3,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    scene.add(chronoGroup)
    chronoGroup.position.set(0, 0, -2)

    // Mouse Tracking with Inertia
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2
      targetY = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    // Animation Loop
    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const elapsedTime = clock.getElapsedTime()

      mouseX += (targetX - mouseX) * 0.04
      mouseY += (targetY - mouseY) * 0.04

      // Gentle continuous rotation
      ring1.rotation.z = elapsedTime * 0.08
      ring1.rotation.x = Math.sin(elapsedTime * 0.05) * 0.2
      ring2.rotation.y = elapsedTime * 0.1
      ring2.rotation.z = Math.cos(elapsedTime * 0.06) * 0.25
      icosahedron.rotation.x = -elapsedTime * 0.09
      icosahedron.rotation.y = elapsedTime * 0.12
      octahedron.rotation.y = -elapsedTime * 0.18
      octahedron.rotation.x = Math.sin(elapsedTime * 0.15) * 0.3

      // Ambient celestial particle drift
      particles.rotation.y = elapsedTime * 0.015
      particles.rotation.x = Math.sin(elapsedTime * 0.01) * 0.05

      // Natural breathing oscillation in 3D space
      chronoGroup.position.y = -1.5 + Math.sin(elapsedTime * 0.8) * 0.45
      chronoGroup.position.x = Math.cos(elapsedTime * 0.6) * 0.35

      // Cursor reactive tilt with physical perspective
      chronoGroup.rotation.y = mouseX * 0.45
      chronoGroup.rotation.x = -mouseY * 0.3

      // Dynamic reactive specular lights tracking cursor
      pointLight.position.x = 10 + mouseX * 14
      pointLight.position.y = 10 - mouseY * 14
      secondaryLight.position.x = -10 - mouseX * 10
      secondaryLight.position.y = -10 + mouseY * 10

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-75"
    />
  )
}
