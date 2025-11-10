import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ros2Connection } from "@/lib/ros2Connection";

const Manual = () => {
  const { toast } = useToast();
  
  // ROS2 连接状态
  const [rosUrl, setRosUrl] = useState("ws://192.168.5.100:9090");
  const [isConnected, setIsConnected] = useState(false);

  // 底盘状态
  const [chassisEnabled, setChassisEnabled] = useState(false);
  const [chassisX, setChassisX] = useState(0);
  const [chassisY, setChassisY] = useState(0);
  const [chassisZ, setChassisZ] = useState(0);

  // 机械臂状态
  const [armEnabled, setArmEnabled] = useState(false);
  const [armYaw, setArmYaw] = useState(0);
  const [armRoll, setArmRoll] = useState(0);
  const [armUpdown, setArmUpdown] = useState(0);

  // 泵状态
  const [pumpOn, setPumpOn] = useState(false);
  const [pumpSpeed, setPumpSpeed] = useState(0);
  const [pumpFlud, setPumpFlud] = useState(0);

  // 半自动参数
  const [bladeRoller, setBladeRoller] = useState(0);
  const [direction, setDirection] = useState(0);
  const [width, setWidth] = useState(0);
  const [length, setLength] = useState(0);
  const [thickness, setThickness] = useState(0);

  // ROS2 连接
  const handleConnect = async () => {
    try {
      await ros2Connection.connect(rosUrl);
      setIsConnected(true);
      ros2Connection.sendConnectionEstablishRequest(1);
      toast({
        title: "连接成功",
        description: "已成功连接到 ROS2 服务器",
      });
    } catch (error: any) {
      toast({
        title: "连接失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    ros2Connection.sendConnectionEstablishRequest(0);
    ros2Connection.disconnect();
    setIsConnected(false);
    setChassisEnabled(false);
    setArmEnabled(false);
    toast({
      title: "已断开连接",
      description: "与 ROS2 服务器的连接已断开",
    });
  };

  // 底盘使能
  const handleChassisEnable = () => {
    const newState = !chassisEnabled;
    ros2Connection.sendChassisEnableRequest(newState ? 1 : 0);
    setChassisEnabled(newState);
  };

  // 机械臂使能
  const handleArmEnable = () => {
    const newState = !armEnabled;
    ros2Connection.sendArmEnableRequest(newState ? 1 : 0);
    setArmEnabled(newState);
  };

  // 泵控制
  const handlePumpSwitch = () => {
    const newState = !pumpOn;
    setPumpOn(newState);
    ros2Connection.publishPumpControl({
      pump_switch: newState ? 1 : 0,
      pump_speed: pumpSpeed,
      pump_flud: pumpFlud,
    });
  };

  // 机械臂复位
  const handleArmReset = () => {
    ros2Connection.publishArmControl({
      yaw_angle: 0,
      roll_angle: 0,
      updown_angle: 0,
      arm_reset: 1,
    });
    setArmYaw(0);
    setArmRoll(0);
    setArmUpdown(0);
  };

  // 半自动提交
  const handleSemiAutoSubmit = () => {
    ros2Connection.sendSemiModeRequest(bladeRoller, direction, width, length, thickness);
    toast({
      title: "半自动参数已提交",
      description: "机器人将开始半自动施工",
    });
  };

  // 停止
  const handleStop = () => {
    ros2Connection.sendStopRequest(1);
    toast({
      title: "紧急停止",
      description: "已发送紧急停止指令",
      variant: "destructive",
    });
  };

  // 继续
  const handleContinue = () => {
    ros2Connection.sendStopRequest(0);
    toast({
      title: "继续运行",
      description: "机器人将继续运行",
    });
  };

  // 模式切换
  const handleModeChange = (mode: string) => {
    const modeMap: { [key: string]: number } = {
      manual: 1,
      semiauto: 2,
    };
    ros2Connection.sendMachineModeRequest(modeMap[mode]);
  };

  // 实时发布机械臂控制
  useEffect(() => {
    if (armEnabled) {
      const interval = setInterval(() => {
        ros2Connection.publishArmControl({
          yaw_angle: armYaw,
          roll_angle: armRoll,
          updown_angle: armUpdown,
          arm_reset: 0,
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [armEnabled, armYaw, armRoll, armUpdown]);

  // 实时发布底盘控制
  useEffect(() => {
    if (chassisEnabled) {
      const interval = setInterval(() => {
        ros2Connection.publishChassisControl({
          x_speed: chassisX,
          y_speed: chassisY,
          z_speed: chassisZ,
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [chassisEnabled, chassisX, chassisY, chassisZ]);

  // 实时发布泵控制
  useEffect(() => {
    if (pumpOn) {
      ros2Connection.publishPumpControl({
        pump_switch: 1,
        pump_speed: pumpSpeed,
        pump_flud: pumpFlud,
      });
    }
  }, [pumpOn, pumpSpeed, pumpFlud]);

  return (
    <div className="p-6 space-y-6">
      {/* 连接控制 */}
      <Card>
        <CardHeader>
          <CardTitle>ROS2 连接</CardTitle>
          <CardDescription>WebSocket 服务器地址</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={rosUrl}
              onChange={(e) => setRosUrl(e.target.value)}
              placeholder="ws://192.168.5.100:9090"
              disabled={isConnected}
            />
            {!isConnected ? (
              <Button onClick={handleConnect}>连接</Button>
            ) : (
              <Button onClick={handleDisconnect} variant="destructive">
                断开
              </Button>
            )}
          </div>
          <div className="mt-2">
            状态: <span className={isConnected ? "text-green-600" : "text-red-600"}>
              {isConnected ? "已连接" : "未连接"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 控制模式 */}
      <Tabs defaultValue="manual" onValueChange={handleModeChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">手动模式</TabsTrigger>
          <TabsTrigger value="semiauto">半自动模式</TabsTrigger>
        </TabsList>

        {/* 手动模式 */}
        <TabsContent value="manual" className="space-y-6">
          {/* 底盘控制 */}
          <Card>
            <CardHeader>
              <CardTitle>底盘控制</CardTitle>
              <CardDescription>控制机器人底盘运动</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-center">
                <Button onClick={handleChassisEnable} disabled={!isConnected}>
                  {chassisEnabled ? "禁用底盘" : "使能底盘"}
                </Button>
                <span className={chassisEnabled ? "text-green-600" : "text-muted-foreground"}>
                  {chassisEnabled ? "已使能" : "未使能"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>X 速度: {chassisX.toFixed(2)} m/s</Label>
                  <Slider
                    value={[chassisX]}
                    onValueChange={(v) => setChassisX(v[0])}
                    min={-1}
                    max={1}
                    step={0.01}
                    disabled={!chassisEnabled}
                  />
                </div>

                <div>
                  <Label>Y 速度: {chassisY.toFixed(2)} m/s</Label>
                  <Slider
                    value={[chassisY]}
                    onValueChange={(v) => setChassisY(v[0])}
                    min={-1}
                    max={1}
                    step={0.01}
                    disabled={!chassisEnabled}
                  />
                </div>

                <div>
                  <Label>Z 速度: {chassisZ.toFixed(2)} °/s</Label>
                  <Slider
                    value={[chassisZ]}
                    onValueChange={(v) => setChassisZ(v[0])}
                    min={-90}
                    max={90}
                    step={1}
                    disabled={!chassisEnabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 机械臂控制 */}
          <Card>
            <CardHeader>
              <CardTitle>机械臂控制</CardTitle>
              <CardDescription>控制机械臂姿态</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-center">
                <Button onClick={handleArmEnable} disabled={!isConnected}>
                  {armEnabled ? "禁用机械臂" : "使能机械臂"}
                </Button>
                <Button onClick={handleArmReset} disabled={!armEnabled}>
                  复位
                </Button>
                <span className={armEnabled ? "text-green-600" : "text-muted-foreground"}>
                  {armEnabled ? "已使能" : "未使能"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Yaw 角度: {armYaw.toFixed(1)}°</Label>
                  <Slider
                    value={[armYaw]}
                    onValueChange={(v) => setArmYaw(v[0])}
                    min={-90}
                    max={90}
                    step={1}
                    disabled={!armEnabled}
                  />
                </div>

                <div>
                  <Label>Roll 角度: {armRoll.toFixed(1)}°</Label>
                  <Slider
                    value={[armRoll]}
                    onValueChange={(v) => setArmRoll(v[0])}
                    min={-180}
                    max={180}
                    step={1}
                    disabled={!armEnabled}
                  />
                </div>

                <div>
                  <Label>升降位置: {armUpdown.toFixed(1)} cm</Label>
                  <Slider
                    value={[armUpdown]}
                    onValueChange={(v) => setArmUpdown(v[0])}
                    min={0}
                    max={8}
                    step={0.1}
                    disabled={!armEnabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 泵控制 */}
          <Card>
            <CardHeader>
              <CardTitle>泵控制</CardTitle>
              <CardDescription>控制泵的开关和参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-center">
                <Button onClick={handlePumpSwitch} disabled={!isConnected}>
                  {pumpOn ? "关闭泵" : "启动泵"}
                </Button>
                <span className={pumpOn ? "text-green-600" : "text-muted-foreground"}>
                  {pumpOn ? "运行中" : "已停止"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>泵速: {pumpSpeed} ml/s</Label>
                  <Slider
                    value={[pumpSpeed]}
                    onValueChange={(v) => setPumpSpeed(v[0])}
                    min={0}
                    max={200}
                    step={1}
                    disabled={!pumpOn}
                  />
                </div>

                <div>
                  <Label>泵流量: {pumpFlud} ml</Label>
                  <Slider
                    value={[pumpFlud]}
                    onValueChange={(v) => setPumpFlud(v[0])}
                    min={0}
                    max={12}
                    step={0.1}
                    disabled={!pumpOn}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 半自动模式 */}
        <TabsContent value="semiauto" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>半自动施工参数</CardTitle>
              <CardDescription>配置半自动施工参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>施工方式</Label>
                <RadioGroup
                  value={bladeRoller.toString()}
                  onValueChange={(v) => setBladeRoller(parseInt(v))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="blade" />
                    <Label htmlFor="blade">刮涂</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="roller" />
                    <Label htmlFor="roller">辊涂</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>方向</Label>
                <RadioGroup
                  value={direction.toString()}
                  onValueChange={(v) => setDirection(parseInt(v))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="left" />
                    <Label htmlFor="left">向左</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="right" />
                    <Label htmlFor="right">向右</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>宽度 (mm)</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value))}
                  min={0}
                  max={2600}
                />
              </div>

              <div>
                <Label>长度 (mm)</Label>
                <Input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value))}
                  min={0}
                  max={20000}
                />
              </div>

              <div>
                <Label>厚度 (mm)</Label>
                <Input
                  type="number"
                  value={thickness}
                  onChange={(e) => setThickness(parseFloat(e.target.value))}
                  min={0}
                  max={20}
                  step={0.1}
                />
              </div>

              <Button onClick={handleSemiAutoSubmit} disabled={!isConnected} className="w-full">
                提交半自动参数
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>施工控制</CardTitle>
              <CardDescription>紧急停止和继续控制</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button onClick={handleStop} variant="destructive" disabled={!isConnected}>
                紧急停止
              </Button>
              <Button onClick={handleContinue} disabled={!isConnected}>
                继续运行
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manual;


