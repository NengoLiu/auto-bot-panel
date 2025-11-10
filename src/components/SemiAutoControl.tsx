import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { ros2Connection } from "@/lib/ros2Connection";
import { toast } from "sonner";

interface SemiAutoControlProps {
  isConnected: boolean;
}

export const SemiAutoControl = ({ isConnected }: SemiAutoControlProps) => {
  const [bladeRoller, setBladeRoller] = useState<"0" | "1">("0");
  const [direction, setDirection] = useState<"0" | "1">("0");
  const [width, setWidth] = useState<number>(1000);
  const [length, setLength] = useState<number>(5000);
  const [thickness, setThickness] = useState<number>(5);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [lastConfig, setLastConfig] = useState<{
    blade_roller: number;
    direction: number;
    width: number;
    length: number;
    thickness: number;
  } | null>(null);

  const adjustValue = (
    value: number,
    delta: number,
    min: number,
    max: number,
    setter: (v: number) => void
  ) => {
    const newValue = Math.min(Math.max(value + delta, min), max);
    setter(newValue);
  };

  const handleSubmit = () => {
    if (!isConnected) {
      toast.error("请先建立ROS2连接");
      return;
    }

    const config = {
      blade_roller: parseInt(bladeRoller),
      direction: parseInt(direction),
      width,
      length,
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
    if (!isConnected) {
      toast.error("请先建立ROS2连接");
      return;
    }

    ros2Connection.sendStopRequest(stopCmd);
    toast.success("停止指令已发送");
    setIsStopped(true);
  };

  const handleContinue = () => {
    if (!isConnected) {
      toast.error("请先建立ROS2连接");
      return;
    }

    if (!lastConfig) {
      toast.error("没有保存的配置");
      return;
    }

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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>辊涂/刮涂模式设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 模式选择 */}
        <div className="space-y-3">
          <Label>施工模式</Label>
          <RadioGroup value={bladeRoller} onValueChange={(v) => setBladeRoller(v as "0" | "1")} disabled={isConfigured}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="blade" disabled={isConfigured} />
              <Label htmlFor="blade" className="cursor-pointer">刮涂</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="roller" disabled={isConfigured} />
              <Label htmlFor="roller" className="cursor-pointer">辊涂</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 方向选择 */}
        <div className="space-y-3">
          <Label>施工方向</Label>
          <RadioGroup value={direction} onValueChange={(v) => setDirection(v as "0" | "1")} disabled={isConfigured}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="left" disabled={isConfigured} />
              <Label htmlFor="left" className="cursor-pointer">向左</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="right" disabled={isConfigured} />
              <Label htmlFor="right" className="cursor-pointer">向右</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 宽度设置 */}
        <div className="space-y-3">
          <Label>宽度 (0-2600mm)</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustValue(width, -10, 0, 2600, setWidth)}
              disabled={!isConnected || isConfigured}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={width}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setWidth(Math.min(Math.max(val, 0), 2600));
              }}
              className="text-center"
              disabled={!isConnected || isConfigured}
              min={0}
              max={2600}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustValue(width, 10, 0, 2600, setWidth)}
              disabled={!isConnected || isConfigured}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[40px]">mm</span>
          </div>
        </div>

        {/* 长度设置 */}
        <div className="space-y-3">
          <Label>长度 (0-20000mm)</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustValue(length, -100, 0, 20000, setLength)}
              disabled={!isConnected || isConfigured}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={length}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setLength(Math.min(Math.max(val, 0), 20000));
              }}
              className="text-center"
              disabled={!isConnected || isConfigured}
              min={0}
              max={20000}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustValue(length, 100, 0, 20000, setLength)}
              disabled={!isConnected || isConfigured}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[40px]">mm</span>
          </div>
        </div>

        {/* 厚度设置 */}
        <div className="space-y-3">
          <Label>厚度 (0-20mm)</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustValue(thickness, -0.5, 0, 20, setThickness)}
              disabled={!isConnected || isConfigured}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={thickness}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setThickness(Math.min(Math.max(val, 0), 20));
              }}
              className="text-center"
              disabled={!isConnected || isConfigured}
              min={0}
              max={20}
              step={0.1}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustValue(thickness, 0.5, 0, 20, setThickness)}
              disabled={!isConnected || isConfigured}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[40px]">mm</span>
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="space-y-3">
          {/* 设置施工模式按钮 */}
          <Button
            onClick={handleSubmit}
            disabled={!isConnected || isConfigured}
            className="w-full"
          >
            设置施工模式
          </Button>

          {/* 停止和更换按钮 */}
          {isConfigured && !isStopped && (
            <div className="flex gap-3">
              <Button
                onClick={() => handleStop(1)}
                disabled={!isConnected}
                className="flex-1"
                variant="destructive"
              >
                停止
              </Button>
              <Button
                onClick={() => handleStop(2)}
                disabled={!isConnected}
                className="flex-1"
                variant="outline"
              >
                更换配件、涂料
              </Button>
            </div>
          )}

          {/* 继续施工按钮 */}
          {isStopped && (
            <Button
              onClick={handleContinue}
              disabled={!isConnected}
              className="w-full"
            >
              继续施工
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
