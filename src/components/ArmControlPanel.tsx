import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { ros2Connection } from "@/lib/ros2Connection";
import { useToast } from "@/hooks/use-toast";
import { ArmModel3D } from "./ArmModel3D";

const ARM_STORAGE_KEY = "arm_control_state";

const loadArmState = () => {
  try {
    const saved = sessionStorage.getItem(ARM_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveArmState = (state: { yaw: number; roll: number; updown: number }) => {
  try {
    sessionStorage.setItem(ARM_STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

interface ArmControlPanelProps {
  isEnabled: boolean;
  isConnected: boolean;
}

export const ArmControlPanel = ({ isEnabled, isConnected }: ArmControlPanelProps) => {
  const { toast } = useToast();
  const savedState = loadArmState();
  const [yaw, setYaw] = useState(savedState.yaw ?? 0);
  const [roll, setRoll] = useState(savedState.roll ?? 0);
  const [updown, setUpdown] = useState(savedState.updown ?? 0);

  // 持久化状态
  useEffect(() => {
    saveArmState({ yaw, roll, updown });
  }, [yaw, roll, updown]);

  const sendArmControl = (yawVal: number, rollVal: number, updownVal: number) => {
    if (isEnabled && isConnected) {
      ros2Connection.publishArmControl({
        yaw_angle: yawVal,
        roll_angle: rollVal,
        updown_angle: updownVal,
        arm_reset: 0
      });
    }
  };

  const handleYawChange = (value: number[]) => {
    const newYaw = value[0];
    setYaw(newYaw);
    sendArmControl(newYaw, roll, updown);
  };

  const handleRollChange = (value: number[]) => {
    const newRoll = value[0];
    setRoll(newRoll);
    sendArmControl(yaw, newRoll, updown);
  };

  const handleUpdownChange = (value: number[]) => {
    const newUpdown = value[0];
    setUpdown(newUpdown);
    sendArmControl(yaw, roll, newUpdown);
  };

  const handleReset = () => {
    setYaw(0);
    setRoll(0);
    setUpdown(0);
    sendArmControl(0, 0, 0);
    toast({ title: "已重置", description: "机械臂已归位" });
  };

  const isDisabled = !isEnabled || !isConnected;

  return (
    <div className="cyber-card p-2 flex flex-col min-h-fit">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <div className="w-1 h-3 bg-accent rounded-full" />
          <span className="text-[10px] font-semibold text-muted-foreground">机械臂</span>
          <span className="text-[8px] text-muted-foreground">ARM</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isDisabled}
          className="text-[10px] h-6 px-2"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          复位
        </Button>
      </div>

      {/* 3D Model - 占据更大空间 */}
      <div className="flex-1 min-h-0">
        <ArmModel3D yaw={yaw} roll={roll} updown={updown} />
      </div>

      {/* Control Sliders - 更紧凑 */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        {/* Yaw: ±90° */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">YAW</span>
            <span className="text-[10px] font-medium text-primary">{yaw}°</span>
          </div>
          <Slider
            value={[yaw]}
            onValueChange={handleYawChange}
            min={-90}
            max={90}
            step={1}
            disabled={isDisabled}
            className="w-full"
          />
        </div>

        {/* Roll: ±180° */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">ROLL</span>
            <span className="text-[10px] font-medium text-primary">{roll}°</span>
          </div>
          <Slider
            value={[roll]}
            onValueChange={handleRollChange}
            min={-180}
            max={180}
            step={1}
            disabled={isDisabled}
            className="w-full"
          />
        </div>

        {/* Updown: 0-8cm */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">LIFT</span>
            <span className="text-[10px] font-medium text-primary">{updown}cm</span>
          </div>
          <Slider
            value={[updown]}
            onValueChange={handleUpdownChange}
            min={0}
            max={8}
            step={0.1}
            disabled={isDisabled}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
