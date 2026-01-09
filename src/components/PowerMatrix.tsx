import { Button } from "@/components/ui/button";
import { Move, ArrowLeftRight } from "lucide-react";
import { ros2Connection } from "@/lib/ros2Connection";
import { useToast } from "@/hooks/use-toast";

interface PowerMatrixProps {
  chassisEnabled: boolean;
  armEnabled: boolean;
  isConnected: boolean;
  onChassisToggle: () => void;
  onArmToggle: () => void;
}

export const PowerMatrix = ({ 
  chassisEnabled, 
  armEnabled, 
  isConnected, 
  onChassisToggle, 
  onArmToggle 
}: PowerMatrixProps) => {
  return (
    <div className="cyber-card p-2 h-full">
      {/* Header */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-primary text-xs">⚡</span>
        <span className="text-[10px] font-semibold text-destructive">电源</span>
        <span className="text-[8px] text-muted-foreground">PWR</span>
      </div>

      {/* Toggle Buttons - 垂直排列更紧凑 */}
      <div className="grid grid-cols-1 gap-1">
        <button
          onClick={onChassisToggle}
          disabled={!isConnected}
          className={`p-2 rounded-lg border transition-all ${
            chassisEnabled 
              ? 'bg-primary/20 border-primary text-primary' 
              : 'bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50'
          } disabled:opacity-30`}
        >
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4" />
            <span className="text-[10px] font-semibold">
              底盘 {chassisEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </button>

        <button
          onClick={onArmToggle}
          disabled={!isConnected}
          className={`p-2 rounded-lg border transition-all ${
            armEnabled 
              ? 'bg-primary/20 border-primary text-primary' 
              : 'bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50'
          } disabled:opacity-30`}
        >
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            <span className="text-[10px] font-semibold">
              机械臂 {armEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
