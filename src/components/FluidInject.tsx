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
    <div className="cyber-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-primary" />
          <div>
            <span className="text-xs font-semibold text-destructive">泵控</span>
            <span className="text-[10px] text-muted-foreground ml-2">PUMP</span>
          </div>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={!isConnected}
        />
      </div>

      {/* Flow Rate Slider */}
      <div className="space-y-2">
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
