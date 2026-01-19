import { useState, useRef, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Droplets, Power, Minus, Plus } from "lucide-react";
import { ros2Connection } from "@/lib/ros2Connection";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FluidInjectProps {
  isConnected: boolean;
}

export const FluidInject = ({ isConnected }: FluidInjectProps) => {
  const [isEnabled, setIsEnabled] = useState(false); // 泵使能状态
  const [pumpSpeed, setPumpSpeed] = useState(50); // 泵速度 rpm
  const [pumpFluid, setPumpFluid] = useState(6); // 泵流量 ml/s
  const [pumpDirection, setPumpDirection] = useState<1 | -1>(1); // 1: 抽取, -1: 倒吸
  const [isLoading, setIsLoading] = useState(false);

  // 长按调整 ref
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 计算带方向的值（正值=抽取，负值=倒吸）
  const getDirectedValue = (value: number) => value * pumpDirection;

  // 发送pump_control topic数据
  const sendPumpControlData = (speed: number, fluid: number) => {
    if (isConnected && isEnabled) {
      ros2Connection.publishPumpControl({
        pump_switch: 1,
        pump_speed: speed * pumpDirection,
        pump_flud: fluid * pumpDirection
      });
    }
  };

  // 处理使能/失能切换
  const handleEnableToggle = async () => {
    if (!isConnected) {
      toast.error("请先连接ROS2");
      return;
    }

    setIsLoading(true);
    try {
      if (!isEnabled) {
        // 使能操作：发送带方向的速度值
        const directedSpeed = getDirectedValue(pumpSpeed);
        const response = await ros2Connection.sendPumpEnableRequest(1, directedSpeed);
        if (response.pump_ack === 1) {
          setIsEnabled(true);
          toast.success("泵使能成功");
          // 使能成功后，立即发送一次当前的泵流速和流量（带方向）
          setTimeout(() => {
            ros2Connection.publishPumpControl({
              pump_switch: 1,
              pump_speed: getDirectedValue(pumpSpeed),
              pump_flud: getDirectedValue(pumpFluid)
            });
          }, 100);
        } else {
          toast.error("泵使能失败");
        }
      } else {
        // 失能操作
        const response = await ros2Connection.sendPumpEnableRequest(0, 0);
        if (response.pump_ack === 1) {
          setIsEnabled(false);
          toast.success("泵已失能");
          // 发送关闭指令（保留UI数值，发送全零停止）
          ros2Connection.publishPumpControl({
            pump_switch: 0,
            pump_speed: 0,
            pump_flud: 0
          });
        } else {
          toast.error("泵失能失败");
        }
      }
    } catch (error) {
      console.error("泵使能操作失败:", error);
      toast.error("泵使能操作失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理泵速度变化
  const handleSpeedChange = (value: number[]) => {
    setPumpSpeed(value[0]);
    if (isEnabled && isConnected) {
      ros2Connection.publishPumpControl({
        pump_switch: 1,
        pump_speed: getDirectedValue(value[0]),
        pump_flud: getDirectedValue(pumpFluid)
      });
    }
  };

  // 处理泵流量变化
  const handleFluidChange = (value: number[]) => {
    setPumpFluid(value[0]);
    if (isEnabled && isConnected) {
      ros2Connection.publishPumpControl({
        pump_switch: 1,
        pump_speed: getDirectedValue(pumpSpeed),
        pump_flud: getDirectedValue(value[0])
      });
    }
  };

  // 处理方向切换
  const handleDirectionChange = (checked: boolean) => {
    const newDirection: 1 | -1 = checked ? -1 : 1;
    setPumpDirection(newDirection);
    if (isEnabled && isConnected) {
      ros2Connection.publishPumpControl({
        pump_switch: 1,
        pump_speed: pumpSpeed * newDirection,
        pump_flud: pumpFluid * newDirection
      });
    }
  };

  // 长按调整逻辑
  const startAdjust = useCallback((type: 'speed' | 'fluid', delta: number) => {
    const adjust = () => {
      if (type === 'speed') {
        setPumpSpeed(prev => {
          const newVal = Math.max(0, Math.min(2000, prev + delta));
          if (isEnabled && isConnected) {
            ros2Connection.publishPumpControl({
              pump_switch: 1,
              pump_speed: newVal * pumpDirection,
              pump_flud: pumpFluid * pumpDirection
            });
          }
          return newVal;
        });
      } else {
        setPumpFluid(prev => {
          const newVal = Math.max(0, Math.min(12, +(prev + delta).toFixed(1)));
          if (isEnabled && isConnected) {
            ros2Connection.publishPumpControl({
              pump_switch: 1,
              pump_speed: pumpSpeed * pumpDirection,
              pump_flud: newVal * pumpDirection
            });
          }
          return newVal;
        });
      }
    };
    adjust(); // 立即执行一次
    intervalRef.current = setInterval(adjust, 100); // 长按持续调整
  }, [isEnabled, isConnected, pumpDirection, pumpSpeed, pumpFluid]);

  const stopAdjust = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 调整按钮的事件处理器
  const getAdjustHandlers = (type: 'speed' | 'fluid', delta: number) => ({
    onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); startAdjust(type, delta); },
    onMouseUp: (e: React.MouseEvent) => { e.preventDefault(); stopAdjust(); },
    onMouseLeave: (e: React.MouseEvent) => { e.preventDefault(); stopAdjust(); },
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); startAdjust(type, delta); },
    onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); stopAdjust(); },
    onTouchCancel: (e: React.TouchEvent) => { e.preventDefault(); stopAdjust(); },
  });

  return (
    <div className="cyber-card p-2 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Droplets className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold text-destructive">泵控</span>
          <span className="text-[8px] text-muted-foreground">PUMP</span>
        </div>
        <Button
          variant={isEnabled ? "destructive" : "default"}
          size="sm"
          onClick={handleEnableToggle}
          disabled={!isConnected || isLoading}
          className="h-5 px-2 text-[9px] gap-1"
        >
          <Power className="w-2.5 h-2.5" />
          {isLoading ? "..." : isEnabled ? "失能" : "使能"}
        </Button>
      </div>

      {/* Direction Toggle */}
      <div className="flex items-center justify-between mb-2 py-1 border-b border-border/30">
        <span className="text-[9px] text-muted-foreground">方向</span>
        <div className="flex items-center gap-1">
          <span className={`text-[8px] ${pumpDirection === 1 ? 'text-primary' : 'text-muted-foreground'}`}>抽取</span>
          <Switch
            checked={pumpDirection === -1}
            onCheckedChange={handleDirectionChange}
            disabled={!isConnected}
            className="scale-50"
          />
          <span className={`text-[8px] ${pumpDirection === -1 ? 'text-primary' : 'text-muted-foreground'}`}>倒吸</span>
        </div>
      </div>

      {/* Pump Speed Slider with +/- buttons */}
      <div className="space-y-1 mb-2">
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>速度</span>
          <span className={isEnabled ? 'text-primary' : ''}>{pumpSpeed} rpm</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-5 h-5 flex items-center justify-center rounded bg-muted/50 hover:bg-muted active:bg-muted/80 touch-none select-none disabled:opacity-50"
            disabled={!isConnected}
            {...getAdjustHandlers('speed', -10)}
          >
            <Minus className="w-3 h-3 text-foreground" />
          </button>
          <Slider
            value={[pumpSpeed]}
            onValueChange={handleSpeedChange}
            min={0}
            max={2000}
            step={1}
            disabled={!isConnected}
            className="flex-1"
          />
          <button
            className="w-5 h-5 flex items-center justify-center rounded bg-muted/50 hover:bg-muted active:bg-muted/80 touch-none select-none disabled:opacity-50"
            disabled={!isConnected}
            {...getAdjustHandlers('speed', 10)}
          >
            <Plus className="w-3 h-3 text-foreground" />
          </button>
        </div>
      </div>

      {/* Pump Fluid Slider with +/- buttons */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>流量</span>
          <span className={isEnabled ? 'text-primary' : ''}>{pumpFluid} ml/s</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-5 h-5 flex items-center justify-center rounded bg-muted/50 hover:bg-muted active:bg-muted/80 touch-none select-none disabled:opacity-50"
            disabled={!isConnected}
            {...getAdjustHandlers('fluid', -0.5)}
          >
            <Minus className="w-3 h-3 text-foreground" />
          </button>
          <Slider
            value={[pumpFluid]}
            onValueChange={handleFluidChange}
            min={0}
            max={12}
            step={0.5}
            disabled={!isConnected}
            className="flex-1"
          />
          <button
            className="w-5 h-5 flex items-center justify-center rounded bg-muted/50 hover:bg-muted active:bg-muted/80 touch-none select-none disabled:opacity-50"
            disabled={!isConnected}
            {...getAdjustHandlers('fluid', 0.5)}
          >
            <Plus className="w-3 h-3 text-foreground" />
          </button>
        </div>
      </div>

      {/* Status indicator */}
      {!isEnabled && isConnected && (
        <div className="mt-2 text-center">
          <span className="text-[8px] text-muted-foreground/60">未使能，调整数值不会发送</span>
        </div>
      )}
    </div>
  );
};
