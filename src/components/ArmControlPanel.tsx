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
    <div className="cyber-card p-2 h-full flex flex-col">
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

      {/* 3D Model - 缩小高度 */}
      <div className="h-24 flex-shrink-0">
        <ArmModel3D yaw={yaw} roll={roll} updown={updown} />
      </div>

      {/* Control Sliders - 三排纵向排列，增大滑块长度 */}
      <div className="flex-1 flex flex-col gap-2 mt-2">
        {/* Yaw: ±90° */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground w-10 flex-shrink-0">YAW</span>
          <Slider
            value={[yaw]}
            onValueChange={handleYawChange}
            min={-90}
            max={90}
            step={1}
            disabled={isDisabled}
            className="flex-1"
          />
          <span className="text-[11px] font-medium text-primary w-12 text-right flex-shrink-0">{yaw}°</span>
        </div>

        {/* Roll: ±180° */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground w-10 flex-shrink-0">ROLL</span>
          <Slider
            value={[roll]}
            onValueChange={handleRollChange}
            min={-180}
            max={180}
            step={1}
            disabled={isDisabled}
            className="flex-1"
          />
          <span className="text-[11px] font-medium text-primary w-12 text-right flex-shrink-0">{roll}°</span>
        </div>

        {/* Updown: 0-8cm */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground w-10 flex-shrink-0">LIFT</span>
          <Slider
            value={[updown]}
            onValueChange={handleUpdownChange}
            min={0}
            max={8}
            step={0.1}
            disabled={isDisabled}
            className="flex-1"
          />
          <span className="text-[11px] font-medium text-primary w-12 text-right flex-shrink-0">{updown}cm</span>
        </div>
      </div>
    </div>
  );
};
