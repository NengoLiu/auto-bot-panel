import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ros2Connection } from "@/lib/ros2Connection";
import { Droplets, Power } from "lucide-react";

interface ManualControlProps {
  chassisEnabled: boolean;
  armEnabled: boolean;
  isConnected: boolean;
  onChassisToggle: () => void;
  onArmToggle: () => void;
}

export const ManualControl = ({
  chassisEnabled,
  armEnabled,
  isConnected,
  onChassisToggle,
  onArmToggle,
}: ManualControlProps) => {
  const { toast } = useToast();
  const [pumpOn, setPumpOn] = useState(false);
  const [pumpSpeed, setPumpSpeed] = useState([0]);
  const [pumpFlud, setPumpFlud] = useState([0]);

  const handlePumpToggle = () => {
    if (!isConnected) {
      toast({
        title: "未连接",
        description: "请先连接到ROS2服务器",
        variant: "destructive",
      });
      return;
    }

    const newState = !pumpOn;
    setPumpOn(newState);
    
    ros2Connection.publishPumpControl({
      pump_switch: newState ? 1 : 0,
      pump_speed: pumpSpeed[0],
      pump_flud: pumpFlud[0],
    });

    toast({
      title: newState ? "泵已启动" : "泵已关闭",
      description: `泵状态: ${newState ? "运行中" : "已停止"}`,
    });
  };

  const handlePumpSpeedChange = (value: number[]) => {
    setPumpSpeed(value);
    if (pumpOn) {
      ros2Connection.publishPumpControl({
        pump_switch: 1,
        pump_speed: value[0],
        pump_flud: pumpFlud[0],
      });
    }
  };

  const handlePumpFludChange = (value: number[]) => {
    setPumpFlud(value);
    if (pumpOn) {
      ros2Connection.publishPumpControl({
        pump_switch: 1,
        pump_speed: pumpSpeed[0],
        pump_flud: value[0],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="w-5 h-5" />
            设备使能
          </CardTitle>
          <CardDescription>启用或禁用底盘和机械臂</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>底盘使能</Label>
            <Button
              onClick={onChassisToggle}
              disabled={!isConnected}
              variant={chassisEnabled ? "default" : "outline"}
              size="sm"
            >
              {chassisEnabled ? "已启用" : "已禁用"}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <Label>机械臂使能</Label>
            <Button
              onClick={onArmToggle}
              disabled={!isConnected}
              variant={armEnabled ? "default" : "outline"}
              size="sm"
            >
              {armEnabled ? "已启用" : "已禁用"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pump Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            泵控制
          </CardTitle>
          <CardDescription>
            {pumpOn ? "调整泵速和流量" : "请先启动泵"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>泵开关</Label>
            <Button
              onClick={handlePumpToggle}
              disabled={!isConnected}
              variant={pumpOn ? "default" : "outline"}
              size="sm"
            >
              {pumpOn ? "运行中" : "已停止"}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>泵速 (ml/s)</Label>
              <span className="text-sm font-medium">{pumpSpeed[0]} ml/s</span>
            </div>
            <Slider
              value={pumpSpeed}
              onValueChange={handlePumpSpeedChange}
              max={200}
              min={0}
              step={1}
              disabled={!pumpOn}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>泵流量 (ml)</Label>
              <span className="text-sm font-medium">{pumpFlud[0]} ml</span>
            </div>
            <Slider
              value={pumpFlud}
              onValueChange={handlePumpFludChange}
              max={12}
              min={0}
              step={0.1}
              disabled={!pumpOn}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualControl;


