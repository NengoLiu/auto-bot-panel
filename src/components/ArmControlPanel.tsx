import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { ros2Connection } from "@/lib/ros2Connection";
import { useToast } from "@/hooks/use-toast";
import { ArmModel3D } from "./ArmModel3D";

interface ArmControlPanelProps {
  isEnabled: boolean;
  isConnected: boolean;
}

export const ArmControlPanel = ({ isEnabled, isConnected }: ArmControlPanelProps) => {
  const { toast } = useToast();
  const [yaw, setYaw] = useState(0);
  const [roll, setRoll] = useState(0);
  const [updown, setUpdown] = useState(0);

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
    <div className="cyber-card p-4 space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-accent rounded-full" />
          <div>
            <span className="text-xs font-semibold text-muted-foreground">机械臂控制</span>
            <span className="text-[10px] text-muted-foreground ml-2">ARM</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isDisabled}
          className="text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          复位 <span className="text-[10px] opacity-70 ml-1">RST</span>
        </Button>
      </div>

      {/* 3D Model */}
      <div className="flex-1 min-h-[250px]">
        <ArmModel3D yaw={yaw} roll={roll} updown={updown} />
      </div>

      {/* Control Sliders */}
      <div className="grid grid-cols-3 gap-4">
        {/* Yaw: ±90° */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">偏航角</span>
              <span className="text-[8px] text-muted-foreground ml-1">YAW</span>
            </div>
            <span className="text-xs font-medium text-primary">{yaw}°</span>
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
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>-90°</span>
            <span>90°</span>
          </div>
        </div>

        {/* Roll: ±180° */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">横滚角</span>
              <span className="text-[8px] text-muted-foreground ml-1">ROLL</span>
            </div>
            <span className="text-xs font-medium text-primary">{roll}°</span>
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
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>-180°</span>
            <span>180°</span>
          </div>
        </div>

        {/* Updown: 0-8cm */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">升降</span>
              <span className="text-[8px] text-muted-foreground ml-1">LIFT</span>
            </div>
            <span className="text-xs font-medium text-primary">{updown}cm</span>
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
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0cm</span>
            <span>8cm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
