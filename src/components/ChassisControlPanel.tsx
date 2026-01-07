import { useState, useCallback, useEffect } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, RotateCw, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ros2Connection } from "@/lib/ros2Connection";

interface ChassisControlPanelProps {
  isEnabled: boolean;
  isConnected: boolean;
}

export const ChassisControlPanel = ({ isEnabled, isConnected }: ChassisControlPanelProps) => {
  const [speed, setSpeed] = useState(500);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);

  const sendControl = useCallback((x: number, y: number, z: number) => {
    if (isEnabled && isConnected) {
      ros2Connection.publishChassisControl({ x_speed: x, y_speed: y, z_speed: z });
    }
  }, [isEnabled, isConnected]);

  const handleDirectionPress = (direction: string, x: number, y: number) => {
    if (!isEnabled || !isConnected) return;
    setActiveDirection(direction);
    const speedValue = speed / 1000;
    sendControl(x * speedValue, y * speedValue, 0);
  };

  const handleRotationPress = (direction: string, zDirection: number) => {
    if (!isEnabled || !isConnected) return;
    setActiveDirection(direction);
    const zSpeed = 206.7 * (speed / 1000);
    sendControl(0, 0, zDirection * zSpeed);
  };

  const handleRelease = useCallback(() => {
    setActiveDirection(null);
    if (isEnabled && isConnected) {
      sendControl(0, 0, 0);
    }
  }, [isEnabled, isConnected, sendControl]);

  const adjustSpeed = (delta: number) => {
    setSpeed((prev) => Math.min(Math.max(prev + delta, 100), 2000));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled || !isConnected) return;
      const speedValue = speed / 1000;
      switch (e.key.toLowerCase()) {
        case 'w': handleDirectionPress('forward', 0, 1); break;
        case 's': handleDirectionPress('backward', 0, -1); break;
        case 'a': handleDirectionPress('left', -1, 0); break;
        case 'd': handleDirectionPress('right', 1, 0); break;
      }
    };
    const handleKeyUp = () => handleRelease();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEnabled, isConnected, speed]);

  const isDisabled = !isEnabled || !isConnected;

  const DirectionButton = ({ 
    direction, 
    icon: Icon, 
    x, 
    y,
    className = ""
  }: { 
    direction: string; 
    icon: any; 
    x: number; 
    y: number;
    className?: string;
  }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); handleDirectionPress(direction, x, y); }}
      onMouseUp={(e) => { e.preventDefault(); handleRelease(); }}
      onMouseLeave={(e) => { e.preventDefault(); handleRelease(); }}
      onTouchStart={(e) => { e.preventDefault(); handleDirectionPress(direction, x, y); }}
      onTouchEnd={(e) => { e.preventDefault(); handleRelease(); }}
      onTouchCancel={(e) => { e.preventDefault(); handleRelease(); }}
      disabled={isDisabled}
      className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all touch-none select-none ${
        activeDirection === direction 
          ? 'bg-primary/30 border-primary text-primary' 
          : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
      } border disabled:opacity-30 ${className}`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );

  const RotationButton = ({ 
    direction, 
    icon: Icon,
    label,
    zDirection
  }: { 
    direction: string; 
    icon: any;
    label: string;
    zDirection: number;
  }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); handleRotationPress(direction, zDirection); }}
      onMouseUp={(e) => { e.preventDefault(); handleRelease(); }}
      onMouseLeave={(e) => { e.preventDefault(); handleRelease(); }}
      onTouchStart={(e) => { e.preventDefault(); handleRotationPress(direction, zDirection); }}
      onTouchEnd={(e) => { e.preventDefault(); handleRelease(); }}
      onTouchCancel={(e) => { e.preventDefault(); handleRelease(); }}
      disabled={isDisabled}
      className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all touch-none select-none ${
        activeDirection === direction 
          ? 'bg-primary/30 border-primary text-primary' 
          : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
      } border disabled:opacity-30`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] mt-0.5">{label}</span>
    </button>
  );

  return (
    <div className="cyber-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-primary rounded-full" />
        <div>
          <span className="text-xs font-semibold text-muted-foreground">底盘导航</span>
          <span className="text-[10px] text-muted-foreground ml-2">NAV</span>
        </div>
      </div>

      {/* Direction Pad */}
      <div className="flex flex-col items-center gap-2 py-4">
        <DirectionButton direction="forward" icon={ChevronUp} x={0} y={1} />
        <div className="flex items-center gap-2">
          <DirectionButton direction="left" icon={ChevronLeft} x={-1} y={0} />
          <div className="w-14 h-14 rounded-lg bg-secondary/30 border border-border/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          </div>
          <DirectionButton direction="right" icon={ChevronRight} x={1} y={0} />
        </div>
        <DirectionButton direction="backward" icon={ChevronDown} x={0} y={-1} />
        
        {/* Rotation buttons on sides */}
        <div className="flex items-center justify-between w-full mt-2 px-4">
          <RotationButton direction="ccw" icon={RotateCcw} label="CCW" zDirection={1} />
          <RotationButton direction="cw" icon={RotateCw} label="CW" zDirection={-1} />
        </div>
      </div>

      {/* Speed Control */}
      <div className="cyber-border rounded-lg p-3">
        <div className="text-center mb-2">
          <span className="text-xs font-semibold text-muted-foreground">运动速度</span>
          <span className="text-[10px] text-muted-foreground ml-2">MM/S</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustSpeed(-50)}
            disabled={isDisabled}
            className="rounded-full border border-border/50"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-3xl font-bold text-primary">{speed}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustSpeed(50)}
            disabled={isDisabled}
            className="rounded-full border border-border/50"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
