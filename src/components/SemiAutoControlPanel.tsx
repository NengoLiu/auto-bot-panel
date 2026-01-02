import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Info, Zap, Layers } from "lucide-react";
import { ros2Connection } from "@/lib/ros2Connection";
import { toast } from "sonner";

interface SemiAutoControlPanelProps {
  isConnected: boolean;
}

export const SemiAutoControlPanel = ({ isConnected }: SemiAutoControlPanelProps) => {
  const [bladeRoller, setBladeRoller] = useState<"blade" | "roller">("blade");
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(1.6);
  const [thickness, setThickness] = useState(5);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [lastConfig, setLastConfig] = useState<any>(null);

  const handleSubmit = () => {
    if (!isConnected) {
      toast.error("请先建立ROS2连接");
      return;
    }

    const config = {
      blade_roller: bladeRoller === "blade" ? 0 : 1,
      direction: 0,
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
            {/* Length */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <div>
                  <span className="text-xs font-semibold">长度</span>
                  <span className="text-[10px] text-muted-foreground ml-1">M</span>
                </div>
                <span className="text-2xl font-bold text-primary ml-auto">{length}</span>
              </div>
              <Slider
                value={[length]}
                onValueChange={([v]) => setLength(v)}
                min={1}
                max={20}
                step={0.5}
                disabled={isConfigured}
                className="w-full"
              />
            </div>

            {/* Width */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <div>
                  <span className="text-xs font-semibold">宽度</span>
                  <span className="text-[10px] text-muted-foreground ml-1">M</span>
                </div>
                <span className="text-2xl font-bold text-foreground ml-auto">{width}</span>
              </div>
              <Slider
                value={[width]}
                onValueChange={([v]) => setWidth(v)}
                min={0.5}
                max={2.6}
                step={0.1}
                disabled={isConfigured}
                className="w-full"
              />
            </div>

            {/* Thickness */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <Layers className="w-3 h-3 text-accent" />
                <div>
                  <span className="text-xs font-semibold">厚度</span>
                  <span className="text-[10px] text-muted-foreground ml-1">MM</span>
                </div>
                <span className="text-2xl font-bold text-accent ml-auto">{thickness}</span>
              </div>
              <Slider
                value={[thickness]}
                onValueChange={([v]) => setThickness(v)}
                min={1}
                max={20}
                step={0.5}
                disabled={isConfigured}
                className="w-full"
              />
            </div>
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
