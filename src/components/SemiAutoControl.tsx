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

  const handleSubmit = async () => {
    if (!isConnected) {
      toast.error("请先建立ROS2连接");
      return;
    }

    try {
      const response = await ros2Connection.callSemiMode({
        blade_roller: parseInt(bladeRoller),
        direction: parseInt(direction),
        width,
        length,
        thickness,
      });

      if (response.ack === 1) {
        toast.success("模式设置成功");
      } else {
        toast.error("模式设置失败");
      }
    } catch (error) {
      toast.error("设置失败: " + (error as Error).message);
    }
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
          <RadioGroup value={bladeRoller} onValueChange={(v) => setBladeRoller(v as "0" | "1")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="blade" />
              <Label htmlFor="blade" className="cursor-pointer">刮涂</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="roller" />
              <Label htmlFor="roller" className="cursor-pointer">辊涂</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 方向选择 */}
        <div className="space-y-3">
          <Label>施工方向</Label>
          <RadioGroup value={direction} onValueChange={(v) => setDirection(v as "0" | "1")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="left" />
              <Label htmlFor="left" className="cursor-pointer">向左</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="right" />
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
              disabled={!isConnected}
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
              disabled={!isConnected}
              min={0}
              max={2600}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustValue(width, 10, 0, 2600, setWidth)}
              disabled={!isConnected}
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
              disabled={!isConnected}
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
              disabled={!isConnected}
              min={0}
              max={20000}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustValue(length, 100, 0, 20000, setLength)}
              disabled={!isConnected}
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
              disabled={!isConnected}
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
              disabled={!isConnected}
              min={0}
              max={20}
              step={0.1}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => adjustValue(thickness, 0.5, 0, 20, setThickness)}
              disabled={!isConnected}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[40px]">mm</span>
          </div>
        </div>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={!isConnected}
          className="w-full"
        >
          设置施工模式
        </Button>
      </CardContent>
    </Card>
  );
};
