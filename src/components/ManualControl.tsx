import { useState } from "react";
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
    <div className="h-full flex flex-col gap-1 bg-card rounded-md border p-1.5 overflow-hidden">
      {/* 设备使能 */}
      <div className="shrink-0">
        <div className="flex items-center gap-1 mb-1">
          <Power className="w-2.5 h-2.5 text-primary" />
          <span className="text-[10px] font-medium">设备使能</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Button
            onClick={onChassisToggle}
            disabled={!isConnected}
            variant={chassisEnabled ? "default" : "outline"}
            size="sm"
            className="h-6 text-[10px] px-1"
          >
            底盘{chassisEnabled ? "✓" : ""}
          </Button>
          <Button
            onClick={onArmToggle}
            disabled={!isConnected}
            variant={armEnabled ? "default" : "outline"}
            size="sm"
            className="h-6 text-[10px] px-1"
          >
            臂{armEnabled ? "✓" : ""}
          </Button>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="border-t shrink-0" />

      {/* 泵控制 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <div className="flex items-center gap-1">
            <Droplets className="w-2.5 h-2.5 text-primary" />
            <span className="text-[10px] font-medium">泵控制</span>
          </div>
          <Button
            onClick={handlePumpToggle}
            disabled={!isConnected}
            variant={pumpOn ? "default" : "outline"}
            size="sm"
            className="h-5 text-[9px] px-1.5"
          >
            {pumpOn ? "ON" : "OFF"}
          </Button>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-hidden">
          <div className="space-y-0.5">
            <div className="flex justify-between items-center">
              <Label className="text-[9px]">泵速</Label>
              <span className="text-[9px] font-mono">{pumpSpeed[0]}</span>
            </div>
            <Slider
              value={pumpSpeed}
              onValueChange={handlePumpSpeedChange}
              max={200}
              min={0}
              step={1}
              disabled={!pumpOn}
              className="h-3"
            />
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between items-center">
              <Label className="text-[9px]">流量</Label>
              <span className="text-[9px] font-mono">{pumpFlud[0]}</span>
            </div>
            <Slider
              value={pumpFlud}
              onValueChange={handlePumpFludChange}
              max={12}
              min={0}
              step={0.1}
              disabled={!pumpOn}
              className="h-3"
            />
          </div>
        </div>
      </div>
    </div>
  );
};