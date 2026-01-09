import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, RotateCw, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ros2Connection } from "@/lib/ros2Connection";

interface ChassisControlPanelProps {
  isEnabled: boolean;
  isConnected: boolean;
}

const CHASSIS_STORAGE_KEY = "chassis_control_state";

const loadChassisState = () => {
  try {
    const saved = sessionStorage.getItem(CHASSIS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveChassisState = (state: { speed: number }) => {
  try {
    sessionStorage.setItem(CHASSIS_STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

export const ChassisControlPanel = ({ isEnabled, isConnected }: ChassisControlPanelProps) => {
  const savedState = loadChassisState();
  const [speed, setSpeed] = useState(savedState.speed ?? 500);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const releaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPressingRef = useRef(false);

  // 持久化速度设置
  useEffect(() => {
    saveChassisState({ speed });
  }, [speed]);

  const sendControl = useCallback((x: number, y: number, z: number) => {
    if (isEnabled && isConnected) {
      ros2Connection.publishChassisControl({ x_speed: x, y_speed: y, z_speed: z });
    }
  }, [isEnabled, isConnected]);

  // 强制释放 - 发送停止指令
  const forceRelease = useCallback(() => {
    isPressingRef.current = false;
    setActiveDirection(null);
    if (isEnabled && isConnected) {
      sendControl(0, 0, 0);
    }
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
  }, [isEnabled, isConnected, sendControl]);

  const handleDirectionPress = useCallback((direction: string, x: number, y: number) => {
    if (!isEnabled || !isConnected) return;
    
    // 清除之前的超时
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current);
    }
    
    isPressingRef.current = true;
    setActiveDirection(direction);
    const speedValue = speed / 1000;
    sendControl(x * speedValue, y * speedValue, 0);
    
    // 安全超时：3秒后自动释放（防止卡键）
    releaseTimeoutRef.current = setTimeout(() => {
      if (isPressingRef.current) {
        forceRelease();
      }
    }, 3000);
  }, [isEnabled, isConnected, speed, sendControl, forceRelease]);

  const handleRotationPress = useCallback((direction: string, zDirection: number) => {
    if (!isEnabled || !isConnected) return;
    
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current);
    }
    
    isPressingRef.current = true;
    setActiveDirection(direction);
    const zSpeed = 206.7 * (speed / 1000);
    sendControl(0, 0, zDirection * zSpeed);
    
    releaseTimeoutRef.current = setTimeout(() => {
      if (isPressingRef.current) {
        forceRelease();
      }
    }, 3000);
  }, [isEnabled, isConnected, speed, sendControl, forceRelease]);

  const handleRelease = useCallback(() => {
    forceRelease();
  }, [forceRelease]);

  // 全局事件监听 - 备用释放机制
  useEffect(() => {
    const globalRelease = () => {
      if (isPressingRef.current) {
        forceRelease();
      }
    };

    // 页面可见性变化时释放
    const handleVisibilityChange = () => {
      if (document.hidden) {
        forceRelease();
      }
    };

    // 全局触摸/鼠标释放监听
    window.addEventListener('touchend', globalRelease, { passive: true });
    window.addEventListener('touchcancel', globalRelease, { passive: true });
    window.addEventListener('mouseup', globalRelease, { passive: true });
    window.addEventListener('blur', globalRelease);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('touchend', globalRelease);
      window.removeEventListener('touchcancel', globalRelease);
      window.removeEventListener('mouseup', globalRelease);
      window.removeEventListener('blur', globalRelease);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (releaseTimeoutRef.current) {
        clearTimeout(releaseTimeoutRef.current);
      }
    };
  }, [forceRelease]);

  const adjustSpeed = (delta: number) => {
    setSpeed((prev) => Math.min(Math.max(prev + delta, 100), 2000));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabled || !isConnected) return;
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
  }, [isEnabled, isConnected, speed, handleDirectionPress, handleRelease]);

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
      onPointerDown={(e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handleDirectionPress(direction, x, y); 
      }}
      onPointerUp={(e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        handleRelease(); 
      }}
      onPointerLeave={(e) => { 
        e.preventDefault(); 
        handleRelease(); 
      }}
      onPointerCancel={(e) => { 
        e.preventDefault(); 
        handleRelease(); 
      }}
      onContextMenu={(e) => e.preventDefault()}
      disabled={isDisabled}
      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all touch-none select-none ${
        activeDirection === direction 
          ? 'bg-primary/30 border-primary text-primary' 
          : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
      } border disabled:opacity-30 ${className}`}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      <Icon className="w-5 h-5 pointer-events-none" />
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
      onPointerDown={(e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handleRotationPress(direction, zDirection); 
      }}
      onPointerUp={(e) => { 
        e.preventDefault(); 
        e.stopPropagation();
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        handleRelease(); 
      }}
      onPointerLeave={(e) => { 
        e.preventDefault(); 
        handleRelease(); 
      }}
      onPointerCancel={(e) => { 
        e.preventDefault(); 
        handleRelease(); 
      }}
      onContextMenu={(e) => e.preventDefault()}
      disabled={isDisabled}
      className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all touch-none select-none ${
        activeDirection === direction 
          ? 'bg-primary/30 border-primary text-primary' 
          : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
      } border disabled:opacity-30`}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      <Icon className="w-3 h-3 pointer-events-none" />
      <span className="text-[8px] pointer-events-none">{label}</span>
    </button>
  );

  return (
    <div className="cyber-card p-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1 mb-1">
        <div className="w-1 h-3 bg-primary rounded-full" />
        <span className="text-[10px] font-semibold text-muted-foreground">底盘</span>
        <span className="text-[8px] text-muted-foreground">NAV</span>
      </div>

      {/* Direction Pad - 更紧凑 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        <DirectionButton direction="forward" icon={ChevronUp} x={0} y={1} />
        <div className="flex items-center gap-1">
          <DirectionButton direction="left" icon={ChevronLeft} x={-1} y={0} />
          <div className="w-10 h-10 rounded-lg bg-secondary/30 border border-border/30 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          </div>
          <DirectionButton direction="right" icon={ChevronRight} x={1} y={0} />
        </div>
        <DirectionButton direction="backward" icon={ChevronDown} x={0} y={-1} />
        
        {/* Rotation buttons */}
        <div className="flex items-center justify-between w-full mt-1 px-2">
          <RotationButton direction="ccw" icon={RotateCcw} label="CCW" zDirection={1} />
          <RotationButton direction="cw" icon={RotateCw} label="CW" zDirection={-1} />
        </div>
      </div>

      {/* Speed Control - 更紧凑 */}
      <div className="cyber-border rounded-lg p-2 mt-1">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustSpeed(-50)}
            disabled={isDisabled}
            className="h-8 w-8 rounded-full border border-border/50"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <div className="text-center">
            <span className="text-xl font-bold text-primary">{speed}</span>
            <span className="text-[8px] text-muted-foreground ml-1">mm/s</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustSpeed(50)}
            disabled={isDisabled}
            className="h-8 w-8 rounded-full border border-border/50"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};