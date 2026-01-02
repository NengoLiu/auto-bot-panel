import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import * as THREE from "three";

interface ArmModelProps {
  yaw: number;
  roll: number;
  updown: number;
}

const ArmSegment = ({ 
  position, 
  rotation, 
  length, 
  color 
}: { 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  length: number; 
  color: string;
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Joint sphere */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Arm segment */}
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.12, length, 8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
};

const RobotArm = ({ yaw, roll, updown }: ArmModelProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Convert degrees to radians
  const yawRad = (yaw * Math.PI) / 180;
  const rollRad = (roll * Math.PI) / 180;
  const updownRad = (updown * Math.PI) / 180;

  return (
    <group ref={groupRef}>
      {/* Base */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 0.2, 32]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* First segment - rotates with yaw */}
      <group rotation={[0, yawRad, 0]}>
        <ArmSegment 
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]} 
          length={0.8} 
          color="#1a9a7a" 
        />
        
        {/* Second segment - rotates with roll */}
        <group position={[0, 0.8, 0]} rotation={[rollRad, 0, 0]}>
          <ArmSegment 
            position={[0, 0, 0]} 
            rotation={[0, 0, 0]} 
            length={0.6} 
            color="#2ab090" 
          />
          
          {/* Third segment - rotates with updown */}
          <group position={[0, 0.6, 0]} rotation={[updownRad, 0, 0]}>
            <ArmSegment 
              position={[0, 0, 0]} 
              rotation={[0, 0, 0]} 
              length={0.5} 
              color="#40c6a6" 
            />
            
            {/* End effector */}
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[0.25, 0.1, 0.15]} />
              <meshStandardMaterial color="#8b5cf6" metalness={0.7} roughness={0.2} />
            </mesh>
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
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#40c6a6" />

      {/* Grid */}
      <Grid 
        args={[10, 10]} 
        position={[0, -0.2, 0]}
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
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
};

export const ArmModel3D = ({ yaw, roll, updown }: ArmModelProps) => {
  return (
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden cyber-border">
      <Canvas
        camera={{ position: [2, 2, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(180deg, #0a1520 0%, #050a10 100%)' }}
      >
        <Scene yaw={yaw} roll={roll} updown={updown} />
      </Canvas>
    </div>
  );
};
