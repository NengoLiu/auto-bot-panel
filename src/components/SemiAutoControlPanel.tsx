import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Info, Zap, Layers, Minus, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { ros2Connection } from "@/lib/ros2Connection";
import { toast } from "sonner";

interface SemiAutoControlPanelProps {
  isConnected: boolean;
}

export const SemiAutoControlPanel = ({ isConnected }: SemiAutoControlPanelProps) => {
  const [bladeRoller, setBladeRoller] = useState<"blade" | "roller">("blade");
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(1.6);
  const [thickness, setThickness] = useState(5);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [lastConfig, setLastConfig] = useState<any>(null);

  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
    min: number,
    max: number,
    step: number
  ) => {
    setter((prev) => {
      const newVal = Math.round((prev + delta) * 100) / 100;
      return Math.min(Math.max(newVal, min), max);
    });
  };

  const handleSubmit = () => {
    if (!isConnected) {
      toast.error("请先建立ROS2连接");
      return;
    }

    const config = {
      blade_roller: bladeRoller === "blade" ? 0 : 1,
      direction: direction === "left" ? 0 : 1,
      width: width * 1000,
      length: length * 1000,
      thickness,
    };

    ros2Connection.sendSemiModeRequest(
      config.blade_roller,
      config.direction,
      config.width,
      config.length,
      config.thickness
    );

    toast.success("模式设置已发送");
    setIsConfigured(true);
    setIsStopped(false);
    setLastConfig(config);
  };

  const handleStop = (stopCmd: number) => {
    if (!isConnected) return;
    ros2Connection.sendStopRequest(stopCmd);
    toast.success("停止指令已发送");
    setIsStopped(true);
  };

  const handleContinue = () => {
    if (!isConnected || !lastConfig) return;
    ros2Connection.sendSemiModeRequest(
      lastConfig.blade_roller,
      lastConfig.direction,
      lastConfig.width,
      lastConfig.length,
      lastConfig.thickness
    );
    toast.success("继续施工");
    setIsStopped(false);
  };

  const NumberInput = ({
    label,
    labelEn,
    value,
    unit,
    onIncrease,
    onDecrease,
    disabled,
  }: {
    label: string;
    labelEn: string;
    value: number;
    unit: string;
    onIncrease: () => void;
    onDecrease: () => void;
    disabled: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <div>
          <span className="text-xs font-semibold">{label}</span>
          <span className="text-[10px] text-muted-foreground ml-1">{unit}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDecrease}
          disabled={disabled}
          className="h-10 w-10 rounded-full border border-border/50"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="text-2xl font-bold text-primary min-w-[60px] text-center">{value}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onIncrease}
          disabled={disabled}
          className="h-10 w-10 rounded-full border border-border/50"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="text-[10px] text-muted-foreground text-center">{labelEn}</div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Process Method Selection */}
        <div className="cyber-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-accent" />
            <div>
              <span className="text-xs font-semibold text-accent">施工方式</span>
              <span className="text-[10px] text-muted-foreground ml-2">METHOD</span>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setBladeRoller("blade")}
              disabled={isConfigured}
              className={`w-full py-3 px-4 rounded-lg border transition-all ${
                bladeRoller === "blade"
                  ? "bg-destructive/20 border-destructive text-destructive"
                  : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50"
              } disabled:opacity-50`}
            >
              <div>
                <span className="text-sm font-semibold">刮涂</span>
                <span className="text-[10px] opacity-70 ml-2">BLADE</span>
              </div>
            </button>
            <button
              onClick={() => setBladeRoller("roller")}
              disabled={isConfigured}
              className={`w-full py-3 px-4 rounded-lg border transition-all ${
                bladeRoller === "roller"
                  ? "bg-destructive/20 border-destructive text-destructive"
                  : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50"
              } disabled:opacity-50`}
            >
              <div>
                <span className="text-sm font-semibold">辊涂</span>
                <span className="text-[10px] opacity-70 ml-2">ROLLER</span>
              </div>
            </button>
          </div>

          {/* Direction Selection */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">施工方向</span>
                <span className="text-[10px] text-muted-foreground ml-2">DIR</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDirection("left")}
                disabled={isConfigured}
                className={`flex-1 py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                  direction === "left"
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50"
                } disabled:opacity-50`}
              >
                <ArrowLeft className="w-4 h-4" />
                <div>
                  <span className="text-sm font-semibold">向左</span>
                  <span className="text-[10px] opacity-70 ml-1">L</span>
                </div>
              </button>
              <button
                onClick={() => setDirection("right")}
                disabled={isConfigured}
                className={`flex-1 py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                  direction === "right"
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary/30 border-border/50 text-muted-foreground hover:bg-secondary/50"
                } disabled:opacity-50`}
              >
                <div>
                  <span className="text-sm font-semibold">向右</span>
                  <span className="text-[10px] opacity-70 ml-1">R</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Process Geometry */}
        <div className="cyber-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-xs font-semibold text-muted-foreground">施工尺寸</span>
              <span className="text-[10px] text-muted-foreground ml-2">SIZE</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <NumberInput
              label="长度"
              labelEn="LENGTH"
              value={length}
              unit="M"
              onIncrease={() => adjustValue(setLength, 0.5, 1, 20, 0.5)}
              onDecrease={() => adjustValue(setLength, -0.5, 1, 20, 0.5)}
              disabled={isConfigured}
            />
            <NumberInput
              label="宽度"
              labelEn="WIDTH"
              value={width}
              unit="M"
              onIncrease={() => adjustValue(setWidth, 0.1, 0.5, 2.6, 0.1)}
              onDecrease={() => adjustValue(setWidth, -0.1, 0.5, 2.6, 0.1)}
              disabled={isConfigured}
            />
            <NumberInput
              label="厚度"
              labelEn="THICK"
              value={thickness}
              unit="MM"
              onIncrease={() => adjustValue(setThickness, 0.5, 1, 20, 0.5)}
              onDecrease={() => adjustValue(setThickness, -0.5, 1, 20, 0.5)}
              disabled={isConfigured}
            />
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="cyber-card p-8">
        <div className="flex flex-col items-center justify-center">
          {!isConfigured ? (
            <button
              onClick={handleSubmit}
              disabled={!isConnected}
              className="w-48 h-48 rounded-2xl bg-gradient-to-br from-primary to-primary/60 hover:from-primary/90 hover:to-primary/50 transition-all flex flex-col items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-30"
            >
              <Play className="w-16 h-16 text-primary-foreground" />
              <div className="text-center">
                <span className="text-xl font-semibold text-primary-foreground block">开始施工</span>
                <span className="text-xs text-primary-foreground/70">START</span>
              </div>
            </button>
          ) : !isStopped ? (
            <div className="flex gap-4">
              <Button
                onClick={() => handleStop(1)}
                variant="destructive"
                size="lg"
                className="px-8"
              >
                <div className="text-center">
                  <span className="block">紧急停止</span>
                  <span className="text-[10px] opacity-70">E-STOP</span>
                </div>
              </Button>
              <Button
                onClick={() => handleStop(2)}
                variant="outline"
                size="lg"
                className="px-8"
              >
                <div className="text-center">
                  <span className="block">更换配件</span>
                  <span className="text-[10px] opacity-70">SWAP</span>
                </div>
              </Button>
            </div>
          ) : (
            <button
              onClick={handleContinue}
              className="w-48 h-48 rounded-2xl bg-gradient-to-br from-primary to-primary/60 hover:from-primary/90 hover:to-primary/50 transition-all flex flex-col items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              <Play className="w-16 h-16 text-primary-foreground" />
              <div className="text-center">
                <span className="text-xl font-semibold text-primary-foreground block">继续施工</span>
                <span className="text-xs text-primary-foreground/70">RESUME</span>
              </div>
            </button>
          )}

          {/* Status Info */}
          <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-secondary/30">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {isConfigured 
                ? "运行中 ACTIVE" 
                : "请先配置参数 SET PARAMS"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
