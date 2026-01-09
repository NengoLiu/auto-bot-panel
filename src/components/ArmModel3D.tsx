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

  // 普鲁士蓝色系
  const prussianBlue = "#003153";
  const prussianBlueDark = "#001f3f";
  const prussianBlueLight = "#1a4a6e";
  const white = "#f8f9fa";
  const metalGray = "#c0c5ce";

  return (
    <group ref={groupRef}>
      {/* Base - Yaw motor housing */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.3, 32]} />
        <meshStandardMaterial color={prussianBlue} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Base ring detail */}
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.18, 0.02, 8, 32]} />
        <meshStandardMaterial color={white} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Base indicator */}
      <mesh position={[0.15, 0.1, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
      </mesh>

      {/* Everything below rotates with yaw (around Y axis) */}
      <group rotation={[0, yawRad, 0]}>
        {/* Long horizontal arm connecting yaw to updown/roll assembly */}
        <group position={[0, 0.1, 0]}>
          {/* Arm joint at yaw */}
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={white} metalness={0.6} roughness={0.3} />
          </mesh>
          
          {/* Long horizontal arm */}
          <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.08, 2.4, 8]} />
            <meshStandardMaterial color={prussianBlueLight} metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Arm detail rings */}
          {[0.3, 0.9, 1.5, 2.1].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.085, 0.015, 8, 16]} />
              <meshStandardMaterial color={white} metalness={0.5} roughness={0.4} />
            </mesh>
          ))}

          {/* Updown/Roll assembly at end of arm */}
          <group position={[2.4, 0, 0]}>
            {/* Updown mechanism housing */}
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[0.15, 1.2, 0.15]} />
              <meshStandardMaterial color={prussianBlue} metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* Updown slider rail */}
            <mesh position={[0, 0.4, 0.1]}>
              <boxGeometry args={[0.08, 1.0, 0.04]} />
              <meshStandardMaterial color={metalGray} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Sliding carriage (moves with updown) */}
            <group position={[0, -0.2 + updownOffset, 0]}>
              {/* Carriage block */}
              <mesh>
                <boxGeometry args={[0.2, 0.15, 0.2]} />
                <meshStandardMaterial color={prussianBlueLight} metalness={0.7} roughness={0.3} />
              </mesh>

              {/* Roll mechanism (rotates around Y axis) */}
              <group rotation={[0, rollRad, 0]}>
                {/* Roll motor/joint */}
                <mesh position={[0, -0.15, 0]}>
                  <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
                  <meshStandardMaterial color={white} metalness={0.6} roughness={0.3} />
                </mesh>

                {/* Roller bracket */}
                <mesh position={[0, -0.35, 0]}>
                  <boxGeometry args={[0.15, 0.3, 0.6]} />
                  <meshStandardMaterial color={prussianBlue} metalness={0.6} roughness={0.3} />
                </mesh>

                {/* Main roller - 白色带毛辊筒，长度2.5倍 */}
                <mesh position={[0, -0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.12, 0.12, 2.0, 32]} />
                  <meshStandardMaterial 
                    color={white} 
                    metalness={0.0} 
                    roughness={0.95}
                  />
                </mesh>

                {/* 辊筒绒毛效果 - 多层环形纹理 */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <mesh 
                    key={i} 
                    position={[-0.95 + i * 0.1, -0.55, 0]} 
                    rotation={[0, 0, Math.PI / 2]}
                  >
                    <torusGeometry args={[0.125, 0.008, 6, 24]} />
                    <meshStandardMaterial color="#e8e8e8" metalness={0} roughness={1} />
                  </mesh>
                ))}

                {/* 辊筒芯轴 */}
                <mesh position={[0, -0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.04, 0.04, 2.2, 16]} />
                  <meshStandardMaterial color={metalGray} metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Roller end caps - 加宽 */}
                <mesh position={[-1.05, -0.55, 0]}>
                  <cylinderGeometry args={[0.14, 0.14, 0.08, 24]} />
                  <meshStandardMaterial color={prussianBlueDark} metalness={0.7} roughness={0.3} />
                </mesh>
                <mesh position={[1.05, -0.55, 0]}>
                  <cylinderGeometry args={[0.14, 0.14, 0.08, 24]} />
                  <meshStandardMaterial color={prussianBlueDark} metalness={0.7} roughness={0.3} />
                </mesh>

                {/* End cap details */}
                <mesh position={[-1.05, -0.55, 0]}>
                  <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
                  <meshStandardMaterial color={metalGray} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[1.05, -0.55, 0]}>
                  <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
                  <meshStandardMaterial color={metalGray} metalness={0.8} roughness={0.2} />
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
      {/* Lighting - 增强白色和蓝色的表现 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow color="#ffffff" />
      <directionalLight position={[-3, 3, -3]} intensity={0.5} color="#a0c4ff" />
      <pointLight position={[2, 2, 2]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-2, 1, 0]} intensity={0.3} color="#22d3ee" />

      {/* Grid */}
      <Grid 
        args={[10, 10]} 
        position={[0, -0.8, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#0a2540"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#1a4a6e"
        fadeDistance={10}
        fadeStrength={1}
      />

      {/* Robot Arm */}
      <RobotArm yaw={yaw} roll={roll} updown={updown} />

      {/* Controls - 调整以适应更长的辊筒 */}
      <OrbitControls 
        enablePan={true}
        minDistance={2}
        maxDistance={10}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2}
        target={[1.5, -0.2, 0]}
      />
    </>
  );
};

export const ArmModel3D = ({ yaw, roll, updown }: ArmModelProps) => {
  return (
    <div className="w-full h-full min-h-[80px] rounded-lg overflow-hidden border border-border/30">
      <Canvas
        camera={{ position: [4, 2.5, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(180deg, #0a1a2e 0%, #051020 100%)' }}
      >
        <Scene yaw={yaw} roll={roll} updown={updown} />
      </Canvas>
    </div>
  );
};
