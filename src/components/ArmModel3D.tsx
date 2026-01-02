import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";

interface ArmModelProps {
  yaw: number;
  roll: number;
  updown: number;
}

const RobotArm = ({ yaw, roll, updown }: ArmModelProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Convert degrees to radians - yaw and roll rotate around Y axis
  const yawRad = (yaw * Math.PI) / 180;
  const rollRad = (roll * Math.PI) / 180;
  // updown is linear motion, map to vertical position (0-100 maps to 0-0.8)
  const updownOffset = (updown / 100) * 0.8;

  return (
    <group ref={groupRef}>
      {/* Base - Yaw motor housing */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 32]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Base indicator */}
      <mesh position={[0.15, 0.1, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />
      </mesh>

      {/* Everything below rotates with yaw (around Y axis) */}
      <group rotation={[0, yawRad, 0]}>
        {/* Long horizontal arm connecting yaw to updown/roll assembly */}
        <group position={[0, 0.1, 0]}>
          {/* Arm joint at yaw */}
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Long horizontal arm */}
          <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.08, 2.4, 8]} />
            <meshStandardMaterial color="#666" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Updown/Roll assembly at end of arm */}
          <group position={[2.4, 0, 0]}>
            {/* Updown mechanism housing */}
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[0.15, 1.2, 0.15]} />
              <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Updown slider rail */}
            <mesh position={[0, 0.4, 0.1]}>
              <boxGeometry args={[0.08, 1.0, 0.04]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Sliding carriage (moves with updown) */}
            <group position={[0, -0.2 + updownOffset, 0]}>
              {/* Carriage block */}
              <mesh>
                <boxGeometry args={[0.2, 0.15, 0.2]} />
                <meshStandardMaterial color="#1a9a7a" metalness={0.7} roughness={0.3} />
              </mesh>

              {/* Roll mechanism (rotates around Y axis) */}
              <group rotation={[0, rollRad, 0]}>
                {/* Roll motor/joint */}
                <mesh position={[0, -0.15, 0]}>
                  <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
                  <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Roller bracket */}
                <mesh position={[0, -0.35, 0]}>
                  <boxGeometry args={[0.15, 0.3, 0.6]} />
                  <meshStandardMaterial color="#2ab090" metalness={0.6} roughness={0.3} />
                </mesh>

                {/* Main roller (horizontal cylinder) */}
                <mesh position={[0, -0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.12, 0.12, 0.8, 24]} />
                  <meshStandardMaterial color="#6b8f71" metalness={0.4} roughness={0.6} />
                </mesh>

                {/* Roller end caps */}
                <mesh position={[-0.45, -0.55, 0]}>
                  <cylinderGeometry args={[0.14, 0.14, 0.08, 24]} />
                  <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
                </mesh>
                <mesh position={[0.45, -0.55, 0]}>
                  <cylinderGeometry args={[0.14, 0.14, 0.08, 24]} />
                  <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

const Scene = ({ yaw, roll, updown }: ArmModelProps) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.4} />
      <pointLight position={[2, 2, 2]} intensity={0.4} color="#40c6a6" />

      {/* Grid */}
      <Grid 
        args={[10, 10]} 
        position={[0, -0.8, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1a3a4a"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#2a4a5a"
        fadeDistance={10}
        fadeStrength={1}
      />

      {/* Robot Arm */}
      <RobotArm yaw={yaw} roll={roll} updown={updown} />

      {/* Controls */}
      <OrbitControls 
        enablePan={true}
        minDistance={1.5}
        maxDistance={8}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2}
        target={[1.2, 0, 0]}
      />
    </>
  );
};

export const ArmModel3D = ({ yaw, roll, updown }: ArmModelProps) => {
  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden cyber-border">
      <Canvas
        camera={{ position: [3, 2, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(180deg, #0a1520 0%, #050a10 100%)' }}
      >
        <Scene yaw={yaw} roll={roll} updown={updown} />
      </Canvas>
    </div>
  );
};
