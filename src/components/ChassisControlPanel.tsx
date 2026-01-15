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
  
  // 安全机制的引用
  const isPressingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const stopSentRef = useRef(false); // 防止重复发送停止指令

  // 持久化速度设置
  useEffect(() => {
    saveChassisState({ speed });
  }, [speed]);

  // 发送控制指令
  const sendControl = useCallback((x: number, y: number, z: number) => {
    if (isEnabled && isConnected) {
      ros2Connection.publishChassisControl({ x_speed: x, y_speed: y, z_speed: z });
    }
  }, [isEnabled, isConnected]);

  // 强制释放 - 发送停止指令（带防重复机制）
  const forceRelease = useCallback(() => {
    // 只有在之前是按下状态时才发送停止指令
    if (isPressingRef.current || activeDirection !== null) {
      isPressingRef.current = false;
      activePointerIdRef.current = null;
      setActiveDirection(null);
      
      // 防止重复发送停止指令
      if (!stopSentRef.current) {
        stopSentRef.current = true;
        if (isEnabled && isConnected) {
          // 发送多次停止指令确保可靠性
          sendControl(0, 0, 0);
          // 延迟再发一次作为确认
          setTimeout(() => {
            sendControl(0, 0, 0);
          }, 50);
        }
        // 重置防重复标志
        setTimeout(() => {
          stopSentRef.current = false;
        }, 200);
      }
    }
  }, [isEnabled, isConnected, sendControl, activeDirection]);

  const handleDirectionPress = useCallback((direction: string, x: number, y: number) => {
    if (!isEnabled || !isConnected) return;
    
    stopSentRef.current = false; // 重置停止标志
    isPressingRef.current = true;
    setActiveDirection(direction);
    
    const speedValue = speed / 1000;
    sendControl(x * speedValue, y * speedValue, 0);
  }, [isEnabled, isConnected, speed, sendControl]);

  const handleRotationPress = useCallback((direction: string, zDirection: number) => {
    if (!isEnabled || !isConnected) return;
    
    stopSentRef.current = false; // 重置停止标志
    isPressingRef.current = true;
    setActiveDirection(direction);
    
    const zSpeed = 103.35 * (speed / 1000);
    sendControl(0, 0, zDirection * zSpeed);
  }, [isEnabled, isConnected, speed, sendControl]);

  // 全局事件监听 - 多重备用释放机制
  useEffect(() => {
    const globalRelease = (e?: Event) => {
      // 检查是否需要释放
      if (isPressingRef.current || activeDirection !== null) {
        console.log('[ChassisControl] 全局释放触发', e?.type);
        forceRelease();
      }
    };

    // 页面可见性变化时释放
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[ChassisControl] 页面隐藏，释放控制');
        forceRelease();
      }
    };

    // 窗口失焦时释放
    const handleBlur = () => {
      console.log('[ChassisControl] 窗口失焦，释放控制');
      forceRelease();
    };

    // 监听所有可能的释放事件
    const events = ['touchend', 'touchcancel', 'mouseup', 'pointerup', 'pointercancel'];
    events.forEach(event => {
      window.addEventListener(event, globalRelease, { passive: true, capture: true });
    });
    
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 安卓特有：监听页面暂停事件
    document.addEventListener('pause', forceRelease);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, globalRelease, { capture: true });
      });
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('pause', forceRelease);
    };
  }, [forceRelease, activeDirection]);

  // 组件卸载时确保释放
  useEffect(() => {
    return () => {
      if (isPressingRef.current) {
        if (isEnabled && isConnected) {
          ros2Connection.publishChassisControl({ x_speed: 0, y_speed: 0, z_speed: 0 });
        }
      }
    };
  }, [isEnabled, isConnected]);

  const adjustSpeed = (delta: number) => {
    setSpeed((prev) => Math.min(Math.max(prev + delta, 100), 2000));
  };

  // 键盘控制
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
    const handleKeyUp = () => forceRelease();
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEnabled, isConnected, handleDirectionPress, forceRelease]);

  const isDisabled = !isEnabled || !isConnected;

  // 增强的指针事件处理 - 使用原生事件和多重保障
  const createPointerHandlers = (
    onPress: () => void
  ) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 如果已经有活动的指针，先释放
      if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) {
        forceRelease();
      }
      
      activePointerIdRef.current = e.pointerId;
      const target = e.currentTarget as HTMLElement;
      
      try {
        target.setPointerCapture(e.pointerId);
      } catch (err) {
        console.warn('[ChassisControl] 设置指针捕获失败', err);
      }
      
      onPress();
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.currentTarget as HTMLElement;
      try {
        if (target.hasPointerCapture(e.pointerId)) {
          target.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        console.warn('[ChassisControl] 释放指针捕获失败', err);
      }
      
      forceRelease();
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      console.log('[ChassisControl] pointercancel 触发');
      forceRelease();
    },
    onPointerLeave: (e: React.PointerEvent) => {
      // 只有在没有指针捕获的情况下才释放
      const target = e.currentTarget as HTMLElement;
      if (!target.hasPointerCapture(e.pointerId)) {
        forceRelease();
      }
    },
    onPointerMove: () => {}, // 保留事件处理器以防止事件冒泡
    onLostPointerCapture: () => {
      console.log('[ChassisControl] 指针捕获丢失');
      forceRelease();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    // 添加原生触摸事件作为后备
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      forceRelease();
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      forceRelease();
    },
  });

  // 按钮样式
  const buttonStyle = { 
    WebkitUserSelect: 'none' as const, 
    userSelect: 'none' as const, 
    WebkitTouchCallout: 'none' as const,
    touchAction: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
  };

  // 直接为每个按钮创建handlers，避免内部组件重新渲染问题
  const forwardHandlers = createPointerHandlers(() => handleDirectionPress('forward', 0, 1));
  const backwardHandlers = createPointerHandlers(() => handleDirectionPress('backward', 0, -1));
  const leftHandlers = createPointerHandlers(() => handleDirectionPress('left', -1, 0));
  const rightHandlers = createPointerHandlers(() => handleDirectionPress('right', 1, 0));
  const ccwHandlers = createPointerHandlers(() => handleRotationPress('ccw', 1));
  const cwHandlers = createPointerHandlers(() => handleRotationPress('cw', -1));

  return (
    <div className="cyber-card p-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1 mb-1">
        <div className="w-1 h-3 bg-primary rounded-full" />
        <span className="text-[10px] font-semibold text-muted-foreground">底盘</span>
        <span className="text-[8px] text-muted-foreground">NAV</span>
      </div>

      {/* Direction Pad */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        {/* Forward */}
        <button
          {...forwardHandlers}
          disabled={isDisabled}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all select-none ${
            activeDirection === 'forward' 
              ? 'bg-primary/30 border-primary text-primary' 
              : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
          } border disabled:opacity-30`}
          style={buttonStyle}
        >
          <ChevronUp className="w-5 h-5 pointer-events-none" />
        </button>

        <div className="flex items-center gap-1">
          {/* Left */}
          <button
            {...leftHandlers}
            disabled={isDisabled}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all select-none ${
              activeDirection === 'left' 
                ? 'bg-primary/30 border-primary text-primary' 
                : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
            } border disabled:opacity-30`}
            style={buttonStyle}
          >
            <ChevronLeft className="w-5 h-5 pointer-events-none" />
          </button>

          <div className="w-10 h-10 rounded-lg bg-secondary/30 border border-border/30 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          </div>

          {/* Right */}
          <button
            {...rightHandlers}
            disabled={isDisabled}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all select-none ${
              activeDirection === 'right' 
                ? 'bg-primary/30 border-primary text-primary' 
                : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
            } border disabled:opacity-30`}
            style={buttonStyle}
          >
            <ChevronRight className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Backward */}
        <button
          {...backwardHandlers}
          disabled={isDisabled}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all select-none ${
            activeDirection === 'backward' 
              ? 'bg-primary/30 border-primary text-primary' 
              : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
          } border disabled:opacity-30`}
          style={buttonStyle}
        >
          <ChevronDown className="w-5 h-5 pointer-events-none" />
        </button>
        
        {/* Rotation buttons */}
        <div className="flex items-center justify-between w-full mt-1 px-2">
          {/* CCW */}
          <button
            {...ccwHandlers}
            disabled={isDisabled}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all select-none ${
              activeDirection === 'ccw' 
                ? 'bg-primary/30 border-primary text-primary' 
                : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
            } border disabled:opacity-30`}
            style={buttonStyle}
          >
            <RotateCcw className="w-3 h-3 pointer-events-none" />
            <span className="text-[8px] pointer-events-none">CCW</span>
          </button>

          {/* CW */}
          <button
            {...cwHandlers}
            disabled={isDisabled}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all select-none ${
              activeDirection === 'cw' 
                ? 'bg-primary/30 border-primary text-primary' 
                : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary'
            } border disabled:opacity-30`}
            style={buttonStyle}
          >
            <RotateCw className="w-3 h-3 pointer-events-none" />
            <span className="text-[8px] pointer-events-none">CW</span>
          </button>
        </div>
      </div>

      {/* Speed Control */}
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