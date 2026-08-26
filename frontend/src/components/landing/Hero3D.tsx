"use client"

import { Suspense, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Line, OrbitControls, Stars, useTexture } from "@react-three/drei"
import * as THREE from "three"

type CryptoCoinConfig = {
  symbol: string
  icon: string
  radius: number
  speed: number
  offset: number
  height: number
  scale: number
  edge: string
}

const cryptoCoins: CryptoCoinConfig[] = [
  { symbol: "BTC", icon: "/crypto/btc.png", radius: 3.12, speed: 0.18, offset: 0, height: 0.55, scale: 0.76, edge: "#F7931A" },
  { symbol: "ETH", icon: "/crypto/eth.png", radius: 3.46, speed: 0.145, offset: 1.2, height: -0.35, scale: 0.7, edge: "#627EEA" },
  { symbol: "SOL", icon: "/crypto/sol.png", radius: 3.28, speed: 0.2, offset: 2.45, height: 0.1, scale: 0.67, edge: "#14F195" },
  { symbol: "USDT", icon: "/crypto/usdt.png", radius: 3.68, speed: 0.125, offset: 3.7, height: 0.62, scale: 0.65, edge: "#26A17B" },
  { symbol: "AVAX", icon: "/crypto/avax.png", radius: 3.82, speed: 0.11, offset: 5.05, height: -0.58, scale: 0.62, edge: "#E84142" },
]

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

const networkRoutes = [
  { from: [51.5, -0.1], to: [40.7, -74], color: "#68CFFF" },
  { from: [1.3, 103.8], to: [25.2, 55.3], color: "#FFEA93" },
  { from: [35.7, 139.7], to: [37.8, -122.4], color: "#68CFFF" },
  { from: [19.1, 72.9], to: [-33.9, 151.2], color: "#8DB355" },
  { from: [52.5, 13.4], to: [-23.6, -46.6], color: "#FFEA93" },
] as const

function NetworkArc({
  from,
  to,
  color,
}: {
  from: readonly [number, number]
  to: readonly [number, number]
  color: string
}) {
  const points = useMemo(() => {
    const start = latLonToVector3(from[0], from[1], 1.7)
    const end = latLonToVector3(to[0], to[1], 1.7)
    const midpoint = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.25)
    return new THREE.QuadraticBezierCurve3(start, midpoint, end).getPoints(48)
  }, [from, to])

  return (
    <>
      <Line points={points} color={color} transparent opacity={0.62} lineWidth={0.75} />
      <mesh position={points[0]}>
        <sphereGeometry args={[0.026, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={points[points.length - 1]}>
        <sphereGeometry args={[0.026, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </>
  )
}

function Globe() {
  const earth = useRef<THREE.Group>(null)
  const clouds = useRef<THREE.Mesh>(null)
  const [day, normal, specular, cloudMap, lights] = useTexture([
    "/earth/earth-atmos.jpg",
    "/earth/earth-normal.jpg",
    "/earth/earth-specular.jpg",
    "/earth/earth-clouds.png",
    "/earth/earth-lights.png",
  ])

  day.colorSpace = THREE.SRGBColorSpace
  cloudMap.colorSpace = THREE.SRGBColorSpace
  lights.colorSpace = THREE.SRGBColorSpace

  useFrame((_, delta) => {
    if (earth.current) earth.current.rotation.y += delta * 0.035
    if (clouds.current) clouds.current.rotation.y += delta * 0.055
  })

  return (
    <group ref={earth} rotation={[0.08, -0.42, -0.08]}>
      <mesh>
        <sphereGeometry args={[1.65, 96, 96]} />
        <meshPhongMaterial
          map={day}
          normalMap={normal}
          normalScale={new THREE.Vector2(0.52, 0.52)}
          specularMap={specular}
          specular="#5AA9D6"
          shininess={18}
        />
      </mesh>

      <mesh scale={1.003}>
        <sphereGeometry args={[1.65, 96, 96]} />
        <meshBasicMaterial
          map={lights}
          transparent
          opacity={0.72}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={clouds} scale={1.018}>
        <sphereGeometry args={[1.65, 96, 96]} />
        <meshPhongMaterial
          map={cloudMap}
          transparent
          opacity={0.34}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={1.07}>
        <sphereGeometry args={[1.65, 64, 64]} />
        <meshBasicMaterial
          color="#3BA7FF"
          side={THREE.BackSide}
          transparent
          opacity={0.17}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh scale={1.045}>
        <sphereGeometry args={[1.65, 32, 24]} />
        <meshBasicMaterial color="#7AD7FF" wireframe transparent opacity={0.055} />
      </mesh>

      {networkRoutes.map((route, index) => (
        <NetworkArc key={index} from={route.from} to={route.to} color={route.color} />
      ))}
    </group>
  )
}

function CryptoCoin({ coin }: { coin: CryptoCoinConfig }) {
  const orbit = useRef<THREE.Group>(null)
  const face = useRef<THREE.Group>(null)
  const texture = useTexture(coin.icon)

  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  useFrame(({ clock, camera }) => {
    if (!orbit.current || !face.current) return

    const angle = clock.elapsedTime * coin.speed + coin.offset
    orbit.current.position.set(
      Math.cos(angle) * coin.radius,
      coin.height + Math.sin(angle * 1.45) * 0.18,
      Math.sin(angle) * coin.radius,
    )

    face.current.quaternion.copy(camera.quaternion)
    face.current.rotateZ(Math.sin(angle * 0.9) * 0.08)
  })

  return (
    <group ref={orbit} scale={coin.scale}>
      <group ref={face}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.15, 64]} />
          <meshStandardMaterial attach="material-0" color={coin.edge} metalness={0.9} roughness={0.18} />
          <meshStandardMaterial attach="material-1" map={texture} metalness={0.2} roughness={0.25} />
          <meshStandardMaterial attach="material-2" map={texture} metalness={0.2} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, -0.082]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.455, 64]} />
          <meshStandardMaterial map={texture} metalness={0.2} roughness={0.25} />
        </mesh>
      </group>
    </group>
  )
}

function OrbitRings() {
  const rings = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (rings.current) rings.current.rotation.y += delta * 0.028
  })

  return (
    <group ref={rings}>
      <mesh rotation={[Math.PI / 2.35, 0.08, 0.25]}>
        <torusGeometry args={[2.95, 0.008, 12, 180]} />
        <meshBasicMaterial color="#6FB1C4" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 1.95, 0.35, -0.45]}>
        <torusGeometry args={[3.52, 0.006, 12, 180]} />
        <meshBasicMaterial color="#D8C982" transparent opacity={0.24} />
      </mesh>
      <mesh rotation={[Math.PI / 1.72, -0.15, 0.55]}>
        <torusGeometry args={[3.9, 0.004, 12, 180]} />
        <meshBasicMaterial color="#8DA96A" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

function Scene() {
  const { viewport } = useThree()
  const horizontalOffset = viewport.width > 10 ? 1.15 : 0

  return (
    <>
      <ambientLight intensity={0.48} />
      <directionalLight position={[5, 6, 7]} intensity={2.8} color="#FFF5C6" />
      <pointLight position={[-4, 1, 4]} intensity={18} distance={12} color="#4D8CA8" />
      <pointLight position={[4, -2, 3]} intensity={7} distance={10} color="#D90000" />

      <Stars radius={18} depth={7} count={900} factor={1.4} saturation={0.15} fade speed={0.22} />
      <group position={[horizontalOffset, 0, 0]}>
        <OrbitRings />
        <Globe />
        {cryptoCoins.map((coin) => <CryptoCoin key={coin.symbol} coin={coin} />)}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        rotateSpeed={0.42}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.72}
      />
    </>
  )
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_46%,#152936_0%,#0A1219_44%,#030404_79%)]" />
      <div className="absolute bottom-[12%] right-[12%] top-[12%] w-[54%] rounded-full bg-[#4D8CA8]/12 blur-[120px]" />

      <Canvas
        camera={{ position: [0, 0.18, 8.3], fov: 43 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute right-5 top-5 hidden rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur-xl sm:block">
        AHNA global market map
      </div>
      <p className="pointer-events-none absolute bottom-5 right-6 hidden whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.14em] text-white/50 sm:block">
        Drag to explore · Symbol orbits are illustrative
      </p>
    </div>
  )
}
