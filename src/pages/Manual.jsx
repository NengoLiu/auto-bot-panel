import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import ROSLIB from 'roslib';
import { Activity, XCircle } from "lucide-react";

const Manual = () => {
  // ROS2连接配置
  const ROS_WS_URL = 'ws://192.168.137.96:9090';
  
  // 状态管理
  const [ros, setRos] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rosUrl, setRosUrl] = useState(ROS_WS_URL);
  
  // Topics
  let pumpTopic = null;
  let chassisTopic = null;
  let armTopic = null;
  
  // 控制状态
  const [chassisEnabled, setChassisEnabled] = useState(false);
  const [armEnabled, setArmEnabled] = useState(false);
  const [pumpEnabled, setPumpEnabled] = useState(false);
  const [pumpSpeed, setPumpSpeed] = useState(100);
  const [pumpFluid, setPumpFluid] = useState(6);
  const [yawAngle, setYawAngle] = useState(0);
  const [rollAngle, setRollAngle] = useState(0);
  const [updownAngle, setUpdownAngle] = useState(4);
  
  // 半自动配置
  const [bladeRoller, setBladeRoller] = useState('0');
  const [direction, setDirection] = useState('0');
  const [width, setWidth] = useState('1300');
  const [length, setLength] = useState('10000');
  const [thickness, setThickness] = useState('10');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [lastConfig, setLastConfig] = useState(null);

  // ========== ROS2连接函数 ==========
  const connectROS = () => {
    const newRos = new ROSLIB.Ros({ url: rosUrl });

    newRos.on('connection', () => {
      console.log('已连接到ROS2服务器');
      setRos(newRos);
      setIsConnected(true);
      toast.success("已连接到ROS2");

      // 初始化Topics
      pumpTopic = new ROSLIB.Topic({
        ros: newRos,
        name: '/pump_control',
        messageType: 'web_connect/msg/Pump'
      });

      chassisTopic = new ROSLIB.Topic({
        ros: newRos,
        name: '/chassis_control',
        messageType: 'web_connect/msg/Chassis'
      });

      armTopic = new ROSLIB.Topic({
        ros: newRos,
        name: '/arm_control',
        messageType: 'web_connect/msg/Arm'
      });

      // 自动调用开机服务
      callService('/connection_establish', 'web_connect/srv/Establish', { establish: 1 });
    });

    newRos.on('error', (error) => {
      console.error('连接错误:', error);
      toast.error("连接失败");
    });

    newRos.on('close', () => {
      console.log('连接已关闭');
      setIsConnected(false);
      setRos(null);
      pumpTopic = null;
      chassisTopic = null;
      armTopic = null;
      
      // 自动调用关机服务
      callService('/connection_establish', 'web_connect/srv/Establish', { establish: 0 });
    });
  };

  const disconnectROS = () => {
    if (ros) {
      ros.close();
      toast.info("已断开连接");
    }
  };

  // ========== ROS2服务调用 ==========
  const callService = (serviceName, serviceType, request) => {
    if (!ros) {
      toast.error('未连接到ROS2');
      return;
    }

    const service = new ROSLIB.Service({
      ros: ros,
      name: serviceName,
      serviceType: serviceType
    });

    const rosRequest = new ROSLIB.ServiceRequest(request);

    service.callService(rosRequest, (result) => {
      console.log('服务响应:', result);
    });
  };

  // ========== 控制函数 ==========
  const handleChassisEnable = () => {
    const motor_cmd = chassisEnabled ? 0 : 1;
    callService('/chassis_enable', 'web_connect/srv/Enable', { motor_cmd });
    setChassisEnabled(!chassisEnabled);
    toast.success(chassisEnabled ? "底盘已禁用" : "底盘已使能");
  };

  const handleArmEnable = () => {
    const motor_cmd = armEnabled ? 0 : 1;
    callService('/arm_enable', 'web_connect/srv/Enable', { motor_cmd });
    setArmEnabled(!armEnabled);
    toast.success(armEnabled ? "机械臂已禁用" : "机械臂已使能");
  };

  const handlePumpSwitch = () => {
    if (!ros || !pumpTopic) {
      toast.error("未连接到ROS2");
      return;
    }
    
    const newState = !pumpEnabled;
    setPumpEnabled(newState);

    const message = new ROSLIB.Message({
      pump_switch: newState ? 1 : 0,
      pump_speed: pumpSpeed,
      pump_flud: pumpFluid
    });

    pumpTopic.publish(message);
    toast.success(newState ? "泵已开启" : "泵已关闭");
  };

  const publishChassisControl = (x, y, z) => {
    if (!ros || !chassisTopic) return;
    
    const message = new ROSLIB.Message({
      x_speed: x,
      y_speed: y,
      z_speed: z
    });
    
    chassisTopic.publish(message);
  };

  const publishArmControl = () => {
    if (!ros || !armTopic) return;
    
    const message = new ROSLIB.Message({
      yaw_angle: yawAngle,
      roll_angle: rollAngle,
      updown_angle: updownAngle,
      arm_reset: 0
    });
    
    armTopic.publish(message);
  };

  const handleArmReset = () => {
    if (!ros || !armTopic) {
      toast.error("未连接到ROS2");
      return;
    }

    const message = new ROSLIB.Message({
      yaw_angle: 0,
      roll_angle: 0,
      updown_angle: 4,
      arm_reset: 1
    });

    armTopic.publish(message);
    setYawAngle(0);
    setRollAngle(0);
    setUpdownAngle(4);
    toast.success("机械臂已复位");
  };

  const handleSemiAutoSubmit = () => {
    const config = {
      blade_roller: parseInt(bladeRoller),
      direction: parseInt(direction),
      width: parseFloat(width),
      length: parseFloat(length),
      thickness: parseFloat(thickness)
    };

    callService('/semi_mode', 'web_connect/srv/Semi', config);
    setIsConfigured(true);
    setIsStopped(false);
    setLastConfig(config);
    toast.success("开始施工");
  };

  const handleStop = (stopCmd) => {
    callService('/stop', 'web_connect/srv/Stop', { stop_cmd: stopCmd });
    setIsStopped(true);
    const messages = ["已停止", "紧急停止", "更换料筒"];
    toast.success(messages[stopCmd] || "已停止");
  };

  const handleContinue = () => {
    if (!lastConfig) {
      toast.error("没有配置");
      return;
    }
    
    callService('/semi_mode', 'web_connect/srv/Semi', lastConfig);
    setIsStopped(false);
    toast.success("继续施工");
  };

  const handleModeChange = (value) => {
    if (!isConnected) {
      toast.error("未连接");
      return;
    }

    const mode_cmd = value === "manual" ? 1 : 2;
    callService('/machine_mode', 'web_connect/srv/Mode', { mode_cmd });
    toast.success(value === "manual" ? "手动模式" : "半自动模式");
  };

  // 机械臂控制实时发布
  useEffect(() => {
    if (armEnabled && ros && armTopic) {
      publishArmControl();
    }
  }, [yawAngle, rollAngle, updownAngle, armEnabled, ros]);

  // ========== UI渲染 ==========
  return (
    <div className="p-6">
      {/* ROS2连接 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ROS2 连接</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="text"
              value={rosUrl}
              onChange={(e) => setRosUrl(e.target.value)}
              placeholder="ws://192.168.137.96:9090"
              disabled={isConnected}
              className="flex-1"
            />
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Activity className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={isConnected ? "text-green-500" : "text-red-500"}>
                {isConnected ? "已连接" : "未连接"}
              </span>
            </div>
            <Button onClick={isConnected ? disconnectROS : connectROS}>
              {isConnected ? "断开" : "连接"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 控制区域 */}
      <h1 className="text-3xl font-bold mb-6">手动/半自动施工</h1>

      <Tabs defaultValue="manual" className="w-full" onValueChange={handleModeChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manual">手动</TabsTrigger>
          <TabsTrigger value="semi-auto">半自动</TabsTrigger>
        </TabsList>

        {/* 手动模式 */}
        <TabsContent value="manual" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 底盘控制 */}
            <Card>
              <CardHeader>
                <CardTitle>底盘控制</CardTitle>
                <CardDescription>控制机器人底盘移动</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleChassisEnable}
                  variant={chassisEnabled ? "destructive" : "default"}
                  className="w-full"
                  disabled={!isConnected}
                >
                  {chassisEnabled ? "禁用底盘" : "使能底盘"}
                </Button>

                {chassisEnabled && (
                  <div className="space-y-4">
                     <div className="grid grid-cols-3 gap-2">
                       <div className="col-start-2">
                         <Button
                           className="w-full"
                           onMouseDown={() => publishChassisControl(0.5, 0, 0)}
                           onMouseUp={() => publishChassisControl(0, 0, 0)}
                           onMouseLeave={() => publishChassisControl(0, 0, 0)}
                         >
                           ↑
                         </Button>
                       </div>
                       <Button
                         onMouseDown={() => publishChassisControl(0, -0.5, 0)}
                         onMouseUp={() => publishChassisControl(0, 0, 0)}
                         onMouseLeave={() => publishChassisControl(0, 0, 0)}
                       >
                         ←
                       </Button>
                       <Button
                         onMouseDown={() => publishChassisControl(-0.5, 0, 0)}
                         onMouseUp={() => publishChassisControl(0, 0, 0)}
                         onMouseLeave={() => publishChassisControl(0, 0, 0)}
                       >
                         ↓
                       </Button>
                       <Button
                         onMouseDown={() => publishChassisControl(0, 0.5, 0)}
                         onMouseUp={() => publishChassisControl(0, 0, 0)}
                         onMouseLeave={() => publishChassisControl(0, 0, 0)}
                       >
                         →
                       </Button>
                     </div>
                     <div className="flex gap-2">
                       <Button
                         className="flex-1"
                         onMouseDown={() => publishChassisControl(0, 0, 30)}
                         onMouseUp={() => publishChassisControl(0, 0, 0)}
                         onMouseLeave={() => publishChassisControl(0, 0, 0)}
                       >
                         ↺ 左转
                       </Button>
                       <Button
                         className="flex-1"
                         onMouseDown={() => publishChassisControl(0, 0, -30)}
                         onMouseUp={() => publishChassisControl(0, 0, 0)}
                         onMouseLeave={() => publishChassisControl(0, 0, 0)}
                       >
                         ↻ 右转
                       </Button>
                     </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 机械臂控制 */}
            <Card>
              <CardHeader>
                <CardTitle>机械臂控制</CardTitle>
                <CardDescription>控制机械臂位置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleArmEnable}
                  variant={armEnabled ? "destructive" : "default"}
                  className="w-full"
                  disabled={!isConnected}
                >
                  {armEnabled ? "禁用机械臂" : "使能机械臂"}
                </Button>

                {armEnabled && (
                  <>
                    <div>
                      <Label>偏航角 (Yaw): {yawAngle}°</Label>
                      <Slider
                        value={[yawAngle]}
                        onValueChange={(v) => setYawAngle(v[0])}
                        min={-90}
                        max={90}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>翻滚角 (Roll): {rollAngle}°</Label>
                      <Slider
                        value={[rollAngle]}
                        onValueChange={(v) => setRollAngle(v[0])}
                        min={-180}
                        max={180}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>升降 (Updown): {updownAngle}cm</Label>
                      <Slider
                        value={[updownAngle]}
                        onValueChange={(v) => setUpdownAngle(v[0])}
                        min={0}
                        max={8}
                        step={0.1}
                      />
                    </div>
                    <Button onClick={handleArmReset} variant="outline" className="w-full">
                      复位机械臂
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 泵控制 */}
            <Card>
              <CardHeader>
                <CardTitle>泵控制</CardTitle>
                <CardDescription>控制泵速度和流量</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handlePumpSwitch}
                  variant={pumpEnabled ? "destructive" : "default"}
                  className="w-full"
                  disabled={!isConnected}
                >
                  {pumpEnabled ? "关闭泵" : "开启泵"}
                </Button>

                <div>
                  <Label>泵速度: {pumpSpeed} ml/s</Label>
                  <Slider
                    value={[pumpSpeed]}
                    onValueChange={(v) => setPumpSpeed(v[0])}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <Label>泵流量: {pumpFluid} ml</Label>
                  <Slider
                    value={[pumpFluid]}
                    onValueChange={(v) => setPumpFluid(v[0])}
                    min={0}
                    max={12}
                    step={0.1}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 半自动模式 */}
        <TabsContent value="semi-auto" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>半自动施工配置</CardTitle>
              <CardDescription>设置施工参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>施工模式</Label>
                <RadioGroup value={bladeRoller} onValueChange={setBladeRoller}>
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

              <div className="space-y-2">
                <Label>施工方向</Label>
                <RadioGroup value={direction} onValueChange={setDirection}>
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

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="width">宽度 (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    min="0"
                    max="2600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">长度 (mm)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    min="0"
                    max="20000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thickness">厚度 (mm)</Label>
                  <Input
                    id="thickness"
                    type="number"
                    value={thickness}
                    onChange={(e) => setThickness(e.target.value)}
                    min="0"
                    max="20"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSemiAutoSubmit} disabled={!isConnected} className="flex-1">
                  开始施工
                </Button>
                
                {isConfigured && !isStopped && (
                  <>
                    <Button onClick={() => handleStop(1)} variant="destructive">
                      紧急停止
                    </Button>
                    <Button onClick={() => handleStop(2)} variant="outline">
                      更换料筒
                    </Button>
                  </>
                )}

                {isStopped && (
                  <Button onClick={handleContinue} variant="default">
                    继续施工
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manual;
