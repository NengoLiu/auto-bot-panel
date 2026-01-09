import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Droplets } from "lucide-react";
import { ros2Connection } from "@/lib/ros2Connection";

interface FluidInjectProps {
  isConnected: boolean;
}

export const FluidInject = ({ isConnected }: FluidInjectProps) => {
  const [isActive, setIsActive] = useState(false);
  const [flowRate, setFlowRate] = useState(50);

  const handleToggle = (checked: boolean) => {
    setIsActive(checked);
    if (isConnected) {
      ros2Connection.publishPumpControl({ pump_switch: checked ? 1 : 0, pump_speed: flowRate * 2, pump_flud: 6 });
    }
  };

  const handleFlowChange = (value: number[]) => {
    setFlowRate(value[0]);
    // Could send flow rate to ROS2 if needed
  };

  return (
    <div className="cyber-card p-2 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Droplets className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold text-destructive">泵控</span>
          <span className="text-[8px] text-muted-foreground">PUMP</span>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={!isConnected}
          className="scale-75"
        />
      </div>

      {/* Flow Rate Slider */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>流速</span>
          <span>{flowRate}%</span>
        </div>
        <Slider
          value={[flowRate]}
          onValueChange={handleFlowChange}
          min={0}
          max={100}
          step={1}
          disabled={!isConnected || !isActive}
          className="w-full"
        />
      </div>
    </div>
  );
};
