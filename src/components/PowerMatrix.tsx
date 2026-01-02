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
    <div className="cyber-card p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary text-sm">⚡</span>
        <div>
          <span className="text-xs font-semibold text-destructive">电源矩阵</span>
          <span className="text-[10px] text-muted-foreground ml-2">POWER</span>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onChassisToggle}
          disabled={!isConnected}
          className={`p-4 rounded-lg border transition-all ${
            chassisEnabled 
              ? 'bg-primary/20 border-primary text-primary' 
              : 'bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50'
          } disabled:opacity-30`}
        >
          <Move className="w-5 h-5 mx-auto mb-2" />
          <div className="text-center">
            <span className="text-xs font-semibold block">
              {chassisEnabled ? '底盘启用' : '底盘关闭'}
            </span>
            <span className="text-[10px] opacity-70">{chassisEnabled ? 'ON' : 'OFF'}</span>
          </div>
        </button>

        <button
          onClick={onArmToggle}
          disabled={!isConnected}
          className={`p-4 rounded-lg border transition-all ${
            armEnabled 
              ? 'bg-primary/20 border-primary text-primary' 
              : 'bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50'
          } disabled:opacity-30`}
        >
          <ArrowLeftRight className="w-5 h-5 mx-auto mb-2" />
          <div className="text-center">
            <span className="text-xs font-semibold block">
              {armEnabled ? '机械臂启用' : '机械臂关闭'}
            </span>
            <span className="text-[10px] opacity-70">{armEnabled ? 'ON' : 'OFF'}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
