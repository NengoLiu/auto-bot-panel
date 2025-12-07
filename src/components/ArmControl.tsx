import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ros2Connection } from "@/lib/ros2Connection";
import { RotateCcw } from "lucide-react";

interface ArmControlProps {
  isEnabled: boolean;
  isConnected: boolean;
}

export const ArmControl = ({ isEnabled, isConnected }: ArmControlProps) => {
  const { toast } = useToast();
  const [yawAngle, setYawAngle] = useState([0]);
  const [rollAngle, setRollAngle] = useState([0]);
  const [updownAngle, setUpdownAngle] = useState([0]);

  const sendArmControl = (yaw: number, roll: number, updown: number, reset: number = 0) => {
    if (!isConnected || !isEnabled) return;

    ros2Connection.publishArmControl({
      yaw_angle: yaw,
      roll_angle: roll,
      updown_angle: updown,
      arm_reset: reset,
    });
  };

  const handleYawChange = (value: number[]) => {
    setYawAngle(value);
    sendArmControl(value[0], rollAngle[0], updownAngle[0]);
  };

  const handleRollChange = (value: number[]) => {
    setRollAngle(value);
    sendArmControl(yawAngle[0], value[0], updownAngle[0]);
  };

  const handleUpdownChange = (value: number[]) => {
    setUpdownAngle(value);
    sendArmControl(yawAngle[0], rollAngle[0], value[0]);
  };

  const handleReset = () => {
    setYawAngle([0]);
    setRollAngle([0]);
    setUpdownAngle([0]);
    sendArmControl(0, 0, 0, 1);
    
    toast({
      title: "机械臂复位",
      description: "机械臂已归位到初始位置",
    });
  };

  return (
    <div className="h-full bg-card rounded-md border p-1.5 flex flex-col overflow-hidden">
      {/* 标题 */}
      <div className="flex items-center justify-between shrink-0 mb-1">
        <span className="text-[10px] font-medium">机械臂</span>
        <Button
          onClick={handleReset}
          disabled={!isEnabled || !isConnected}
          variant="outline"
          size="sm"
          className="h-5 text-[9px] px-1.5"
        >
          <RotateCcw className="w-2.5 h-2.5 mr-0.5" />
          复位
        </Button>
      </div>

      {/* 滑块控制 */}
      <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
        {/* Yaw */}
        <div className="space-y-0.5">
          <div className="flex justify-between items-center">
            <Label className="text-[9px]">Yaw</Label>
            <span className="text-[9px] font-mono">{yawAngle[0]}°</span>
          </div>
          <Slider
            value={yawAngle}
            onValueChange={handleYawChange}
            max={90}
            min={-90}
            step={1}
            disabled={!isEnabled}
            className="h-3"
          />
        </div>

        {/* Roll */}
        <div className="space-y-0.5">
          <div className="flex justify-between items-center">
            <Label className="text-[9px]">Roll</Label>
            <span className="text-[9px] font-mono">{rollAngle[0]}°</span>
          </div>
          <Slider
            value={rollAngle}
            onValueChange={handleRollChange}
            max={180}
            min={-180}
            step={1}
            disabled={!isEnabled}
            className="h-3"
          />
        </div>

        {/* 抬升 */}
        <div className="space-y-0.5">
          <div className="flex justify-between items-center">
            <Label className="text-[9px]">抬升</Label>
            <span className="text-[9px] font-mono">{updownAngle[0].toFixed(1)}cm</span>
          </div>
          <Slider
            value={updownAngle}
            onValueChange={handleUpdownChange}
            max={8}
            min={0}
            step={0.1}
            disabled={!isEnabled}
            className="h-3"
          />
        </div>
      </div>
    </div>
  );
};