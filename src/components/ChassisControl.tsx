import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ros2Connection } from "@/lib/ros2Connection";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, RotateCw, Minus, Plus } from "lucide-react";

interface ChassisControlProps {
  isEnabled: boolean;
  isConnected: boolean;
}

export const ChassisControl = ({ isEnabled, isConnected }: ChassisControlProps) => {
  const [speed, setSpeed] = useState(0.5);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);

  const sendControl = useCallback((x: number, y: number, z: number) => {
    if (!isConnected || !isEnabled) return;
    
    ros2Connection.publishChassisControl({
      x_speed: x,
      y_speed: y,
      z_speed: z,
    });
  }, [isConnected, isEnabled]);

  const handleDirectionPress = useCallback((direction: 'forward' | 'backward' | 'left' | 'right', e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setActiveDirection(direction);
    const currentSpeed = speed;
    
    switch (direction) {
      case 'forward':
        sendControl(currentSpeed, 0, 0);
        break;
      case 'backward':
        sendControl(-currentSpeed, 0, 0);
        break;
      case 'left':
        sendControl(0, currentSpeed, 0);
        break;
      case 'right':
        sendControl(0, -currentSpeed, 0);
        break;
    }
  }, [speed, sendControl]);

  const handleRotationPress = useCallback((direction: 'ccw' | 'cw', e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setActiveDirection(direction);
    const currentSpeed = speed;
    const zSpeed = currentSpeed * 206.7;
    
    sendControl(0, 0, direction === 'ccw' ? -zSpeed : zSpeed);
  }, [speed, sendControl]);

  const handleRelease = useCallback((e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setActiveDirection(null);
    sendControl(0, 0, 0);
  }, [sendControl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled || !isConnected) return;
      
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd'].includes(key) && activeDirection === null) {
        e.preventDefault();
        switch (key) {
          case 'w': handleDirectionPress('forward'); break;
          case 's': handleDirectionPress('backward'); break;
          case 'a': handleDirectionPress('left'); break;
          case 'd': handleDirectionPress('right'); break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd'].includes(key)) {
        e.preventDefault();
        handleRelease();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEnabled, isConnected, activeDirection, handleDirectionPress, handleRelease]);

  const adjustSpeed = (delta: number) => {
    setSpeed(prev => Math.min(Math.max(prev + delta, 0), 2));
  };

  const btnBase = "flex items-center justify-center transition-all select-none touch-none active:scale-95";
  const activeClass = "bg-primary text-primary-foreground shadow-lg";
  const inactiveClass = "bg-secondary hover:bg-secondary/80";
  const disabledClass = "opacity-50 cursor-not-allowed";

  const DirButton = ({ dir, icon: Icon, className }: { dir: string; icon: any; className?: string }) => (
    <div
      className={`${btnBase} w-8 h-8 rounded-md ${
        activeDirection === dir ? activeClass : inactiveClass
      } ${!isEnabled ? disabledClass : ''} ${className}`}
      onMouseDown={(e) => isEnabled && handleDirectionPress(dir as any, e)}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={(e) => isEnabled && handleDirectionPress(dir as any, e)}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
    >
      <Icon className="w-5 h-5" />
    </div>
  );

  const RotButton = ({ dir, icon: Icon }: { dir: 'ccw' | 'cw'; icon: any }) => (
    <div
      className={`${btnBase} w-9 h-9 rounded-md ${
        activeDirection === dir ? activeClass : inactiveClass
      } ${!isEnabled ? disabledClass : ''}`}
      onMouseDown={(e) => isEnabled && handleRotationPress(dir, e)}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onTouchStart={(e) => isEnabled && handleRotationPress(dir, e)}
      onTouchEnd={handleRelease}
      onTouchCancel={handleRelease}
    >
      <Icon className="w-5 h-5" />
    </div>
  );

  return (
    <div className="h-full bg-card rounded-md border p-1.5 flex flex-col overflow-hidden">
      {/* 标题行 */}
      <div className="flex items-center justify-between shrink-0 mb-1">
        <span className="text-[10px] font-medium">底盘控制</span>
        <span className="text-[9px] text-muted-foreground">W/S/A/D</span>
      </div>

      {/* 控制区域 - 使用flex-1填满 */}
      <div className="flex-1 flex items-center justify-center gap-4 min-h-0">
        {/* 方向盘 - 使用相对尺寸 */}
        <div className="relative aspect-square h-[min(100%,7rem)] rounded-full bg-muted flex items-center justify-center shrink-0">
          <DirButton dir="forward" icon={ChevronUp} className="absolute top-0.5 left-1/2 -translate-x-1/2" />
          <DirButton dir="left" icon={ChevronLeft} className="absolute left-0.5 top-1/2 -translate-y-1/2" />
          <DirButton dir="right" icon={ChevronRight} className="absolute right-0.5 top-1/2 -translate-y-1/2" />
          <DirButton dir="backward" icon={ChevronDown} className="absolute bottom-0.5 left-1/2 -translate-x-1/2" />
        </div>

        {/* 旋转按钮 */}
        <div className="flex flex-col gap-1.5">
          <RotButton dir="ccw" icon={RotateCcw} />
          <RotButton dir="cw" icon={RotateCw} />
        </div>

        {/* 速度控制 */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustSpeed(0.1)}
            disabled={!isEnabled}
            className="h-8 w-8"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <div className="flex flex-col items-center justify-center w-12 h-10 bg-muted rounded-md">
            <span className="text-[8px] text-muted-foreground">mm/s</span>
            <span className="text-sm font-bold leading-tight">{(speed * 1000).toFixed(0)}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustSpeed(-0.1)}
            disabled={!isEnabled}
            className="h-8 w-8"
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};