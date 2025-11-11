import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ros2Connection } from "@/lib/ros2Connection";
import { CircleDot, RotateCw, MoveVertical, RotateCcw } from "lucide-react";

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
	const prevEnabled = isEnabled;
	isEnabled = false;
	  
    setYawAngle([0]);
    setRollAngle([0]);
    setUpdownAngle([0]);
	
	setTimeout(() => {
	  sendArmControl(0, 0, 0, 1);
	  isEnabled = prevEnabled;
	  
	toast({
	  title: "机械臂复位",
	  description: "机械臂已归位到初始位置",
	});
  },0);
};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDot className="w-5 h-5" />
          机械臂控制
        </CardTitle>
        <CardDescription>
          {isEnabled ? "调整 Yaw、Roll 轴角度和抬升高度" : "请先启用机械臂"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Yaw Axis Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Yaw 轴角度 (°)
            </Label>
            <span className="text-sm font-medium">{yawAngle[0]}°</span>
          </div>
          <Slider
            value={yawAngle}
            onValueChange={handleYawChange}
            max={90}
            min={-90}
            step={1}
            disabled={!isEnabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-90° (左)</span>
            <span>0°</span>
            <span>90° (右)</span>
          </div>
        </div>

        {/* Roll Axis Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              Roll 轴角度 (°)
            </Label>
            <span className="text-sm font-medium">{rollAngle[0]}°</span>
          </div>
          <Slider
            value={rollAngle}
            onValueChange={handleRollChange}
            max={180}
            min={-180}
            step={1}
            disabled={!isEnabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-180° (左)</span>
            <span>0°</span>
            <span>180° (右)</span>
          </div>
        </div>

        {/* Lift Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-2">
              <MoveVertical className="w-4 h-4" />
              抬升高度 (cm)
            </Label>
            <span className="text-sm font-medium">{updownAngle[0].toFixed(1)} cm</span>
          </div>
          <Slider
            value={updownAngle}
            onValueChange={handleUpdownChange}
            max={8}
            min={0}
            step={0.1}
            disabled={!isEnabled}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 cm (最低)</span>
            <span>8 cm (最高)</span>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          onClick={handleReset}
          disabled={!isEnabled || !isConnected}
          className="w-full"
          variant="outline"
          size="lg"
        >
          机械臂复位
        </Button>
      </CardContent>
    </Card>
  );
};

