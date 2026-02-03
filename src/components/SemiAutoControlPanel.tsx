import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Info, Zap, Layers, Minus, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { ros2Connection } from "@/lib/ros2Connection";
import { toast } from "sonner";

const STORAGE_KEY = "semi_auto_state";

interface SemiAutoState {
  bladeRoller: "blade" | "roller";
  paintLayer: number;
  direction: "left" | "right";
  backLength: number;
  length: number;
  width: number;
  thickness: number;
  isConfigured: boolean;
}

const loadState = (): Partial<SemiAutoState> => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveState = (state: SemiAutoState) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

interface SemiAutoControlPanelProps {
  isConnected: boolean;
  chassisEnabled: boolean;
  armEnabled: boolean;
  onChassisDisable: () => void;
  onArmDisable: () => void;
}

export const SemiAutoControlPanel = ({ 
  isConnected, 
  chassisEnabled, 
  armEnabled, 
  onChassisDisable, 
  onArmDisable 
}: SemiAutoControlPanelProps) => {
  const savedState = loadState();
  
  const [bladeRoller, setBladeRoller] = useState<"blade" | "roller">(savedState.bladeRoller || "blade");
  const [paintLayer, setPaintLayer] = useState(savedState.paintLayer ?? 0);
  const [direction, setDirection] = useState<"left" | "right">(savedState.direction || "left");
  const [backLength, setBackLength] = useState(savedState.backLength ?? 0);
  const [length, setLength] = useState(savedState.length ?? 10);
  const [width, setWidth] = useState(savedState.width ?? 1.6);
  const [thickness, setThickness] = useState(savedState.thickness ?? 5);
  const [isConfigured, setIsConfigured] = useState(savedState.isConfigured ?? false);

  // 持久化状态到sessionStorage
  useEffect(() => {
    saveState({
      bladeRoller,
      paintLayer,
      direction,
      backLength,
      length,
      width,
      thickness,
      isConfigured,
    });
  }, [bladeRoller, paintLayer, direction, backLength, length, width, thickness, isConfigured]);

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

  const handleBackLengthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setBackLength(Math.min(Math.max(Math.round(value * 100) / 100, 0), 100));
    } else if (e.target.value === '') {
      setBackLength(0);
    }
  };

  const handleSubmit = () => {
    if (!isConnected) {
      toast.error("请先建立ROS2连接");
      return;
    }

    const config = {
      blade_roller: bladeRoller === "blade" ? 0 : 1,
      paint_layer: paintLayer,
      direction: direction === "left" ? 0 : 1,
      back_length: backLength,
      width,
      length,
      thickness,
    };

    ros2Connection.sendSemiModeRequest(
      config.blade_roller,
      config.paint_layer,
      config.direction,
      config.back_length,
      config.width,
      config.length,
      config.thickness
    );

    toast.success("模式设置已发送");
    setIsConfigured(true);
  };

  const handleStop = (stopCmd: number) => {
    if (!isConnected) return;
    ros2Connection.sendStopRequest(stopCmd);
    
    // 检测并发送底盘和机械臂失能指令
    if (chassisEnabled) {
      onChassisDisable();
    }
    if (armEnabled) {
      onArmDisable();
    }
    
    toast.success("停止指令已发送");
    // 紧急停止后解锁参数，允许重新配置
    setIsConfigured(false);
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
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onDecrease}
        disabled={disabled}
        className="h-7 w-7 rounded-full border border-border/50"
      >
        <Minus className="w-3 h-3" />
      </Button>
      <div className="text-center min-w-[50px]">
        <span className="text-lg font-bold text-primary">{value}</span>
        <span className="text-[9px] text-muted-foreground ml-0.5">{unit}</span>
        <div className="text-[9px] text-muted-foreground leading-none">{label}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onIncrease}
        disabled={disabled}
        className="h-7 w-7 rounded-full border border-border/50"
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );

  return (
    <div className="h-full grid grid-cols-3 gap-2 p-1">
      {/* 左侧：施工方式 + 方向 */}
      <div className="cyber-card p-2 flex flex-col">
        <div className="flex items-center gap-1 mb-2">
          <Zap className="w-3 h-3 text-accent" />
          <span className="text-[10px] font-semibold text-accent">施工方式</span>
          <span className="text-[8px] text-muted-foreground">METHOD</span>
        </div>
        <div className="flex gap-1 mb-1">
          <button
            onClick={() => setBladeRoller("blade")}
            disabled={isConfigured}
            className={`flex-1 py-1 px-2 rounded border text-xs transition-all ${
              bladeRoller === "blade"
                ? "bg-destructive/20 border-destructive text-destructive"
                : "bg-secondary/30 border-border/50 text-muted-foreground"
            } disabled:opacity-50`}
          >
            <span className="font-semibold">刮涂</span>
            <span className="text-[8px] opacity-70 ml-1">BLADE</span>
          </button>
          <button
            onClick={() => setBladeRoller("roller")}
            disabled={isConfigured}
            className={`flex-1 py-1 px-2 rounded border text-xs transition-all ${
              bladeRoller === "roller"
                ? "bg-destructive/20 border-destructive text-destructive"
                : "bg-secondary/30 border-border/50 text-muted-foreground"
            } disabled:opacity-50`}
          >
            <span className="font-semibold">辊涂</span>
            <span className="text-[8px] opacity-70 ml-1">ROLLER</span>
          </button>
        </div>

        {/* 涂料层选择 */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] font-semibold text-muted-foreground">涂料层</span>
          <span className="text-[8px] text-muted-foreground">LAYER</span>
        </div>
        <div className="flex gap-1 mb-1">
          {[
            { value: 0, label: "底漆", en: "BASE" },
            { value: 2, label: "中涂", en: "MID" },
            { value: 3, label: "面漆", en: "TOP" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPaintLayer(item.value)}
              disabled={isConfigured}
              className={`flex-1 py-1 px-1 rounded border text-xs transition-all ${
                paintLayer === item.value
                  ? "bg-accent/20 border-accent text-accent"
                  : "bg-secondary/30 border-border/50 text-muted-foreground"
              } disabled:opacity-50`}
            >
              <span className="font-semibold">{item.label}</span>
              <span className="text-[7px] opacity-70 block">{item.en}</span>
            </button>
          ))}
        </div>

        {/* 方向选择 */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] font-semibold text-muted-foreground">施工方向</span>
          <span className="text-[8px] text-muted-foreground">DIR</span>
        </div>
        <div className="flex gap-1 mb-1">
          <button
            onClick={() => setDirection("left")}
            disabled={isConfigured}
            className={`flex-1 py-1 px-2 rounded border text-xs transition-all flex items-center justify-center gap-1 ${
              direction === "left"
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary/30 border-border/50 text-muted-foreground"
            } disabled:opacity-50`}
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="font-semibold">左</span>
          </button>
          <button
            onClick={() => setDirection("right")}
            disabled={isConfigured}
            className={`flex-1 py-1 px-2 rounded border text-xs transition-all flex items-center justify-center gap-1 ${
              direction === "right"
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary/30 border-border/50 text-muted-foreground"
            } disabled:opacity-50`}
          >
            <span className="font-semibold">右</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 后退距离 */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] font-semibold text-muted-foreground">后退距离</span>
          <span className="text-[8px] text-muted-foreground">BACK</span>
        </div>
        <div className="flex items-center gap-2">
          <Slider
            value={[backLength]}
            onValueChange={([val]) => setBackLength(Math.round(val * 100) / 100)}
            min={0}
            max={100}
            step={0.01}
            disabled={isConfigured}
            className="flex-1"
          />
          <div className="flex items-center">
            <input
              type="number"
              value={backLength}
              onChange={handleBackLengthInput}
              disabled={isConfigured}
              min={0}
              max={100}
              step={0.01}
              className="w-12 text-sm font-bold text-primary bg-transparent text-center border border-border/50 rounded px-1 py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
            />
            <span className="text-[8px] text-muted-foreground ml-1">M</span>
          </div>
        </div>
      </div>

      {/* 中间：施工尺寸 */}
      <div className="cyber-card p-2 flex flex-col">
        <div className="flex items-center gap-1 mb-2">
          <Layers className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-semibold text-muted-foreground">施工尺寸</span>
          <span className="text-[8px] text-muted-foreground">SIZE</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-center gap-2">
          <NumberInput
            label="长度 L"
            labelEn="LENGTH"
            value={length}
            unit="M"
            onIncrease={() => adjustValue(setLength, 0.5, 1, 20, 0.5)}
            onDecrease={() => adjustValue(setLength, -0.5, 1, 20, 0.5)}
            disabled={isConfigured}
          />
          <NumberInput
            label="宽度 W"
            labelEn="WIDTH"
            value={width}
            unit="M"
            onIncrease={() => adjustValue(setWidth, 0.1, 0.5, 2.6, 0.1)}
            onDecrease={() => adjustValue(setWidth, -0.1, 0.5, 2.6, 0.1)}
            disabled={isConfigured}
          />
          <NumberInput
            label="厚度 T"
            labelEn="THICK"
            value={thickness}
            unit="MM"
            onIncrease={() => adjustValue(setThickness, 0.5, 1, 20, 0.5)}
            onDecrease={() => adjustValue(setThickness, -0.5, 1, 20, 0.5)}
            disabled={isConfigured}
          />
        </div>
      </div>

      {/* 右侧：开始/停止按钮 */}
      <div className="cyber-card p-2 flex flex-col items-center justify-center">
        {!isConfigured ? (
          <button
            onClick={handleSubmit}
            disabled={!isConnected}
            className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-primary/60 hover:from-primary/90 hover:to-primary/50 transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-primary/30 disabled:opacity-30"
          >
            <Play className="w-10 h-10 text-primary-foreground" />
            <div className="text-center">
              <span className="text-sm font-semibold text-primary-foreground block">开始</span>
              <span className="text-[8px] text-primary-foreground/70">START</span>
            </div>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleStop(1)}
              variant="destructive"
              size="sm"
              className="text-xs px-4"
            >
              <span>紧急停止</span>
              <span className="text-[8px] opacity-70 ml-1">E-STOP</span>
            </Button>
            <Button
              onClick={() => handleStop(2)}
              variant="outline"
              size="sm"
              className="text-xs px-4"
            >
              <span>更换配件</span>
              <span className="text-[8px] opacity-70 ml-1">SWAP</span>
            </Button>
          </div>
        )}

        {/* 状态提示 */}
        <div className="mt-2 flex items-center gap-1 px-2 py-1 rounded-full border border-border/50 bg-secondary/30">
          <Info className="w-3 h-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground">
            {isConfigured ? "运行中" : "请配置"}
          </span>
        </div>
      </div>
    </div>
  );
};
