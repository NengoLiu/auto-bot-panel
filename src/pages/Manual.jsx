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
  // 连接状态
  const [ros, setRos] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rosUrl, setRosUrl] = useState('ws://192.168.137.96:9090');
  const [isConnecting, setIsConnecting] = useState(false);

  // 控制状态
  const [chassisEnabled, setChassisEnabled] = useState(false);
  const [armEnabled, setArmEnabled] = useState(false);
  const [pumpEnabled, setPumpEnabled] = useState(false);
  const [pumpSpeed, setPumpSpeed] = useState(100);
  const [pumpFluid, setPumpFluid] = useState(6);

  // 底盘控制
  const [xSpeed, setXSpeed] = useState(0);
  const [ySpeed, setYSpeed] = useState(0);
  const [zSpeed, setZSpeed] = useState(0);

  // 机械臂控制
  const [yawAngle, setYawAngle] = useState(0);
  const [rollAngle, setRollAngle] = useState(0);
  const [updownAngle, setUpdownAngle] = useState(4);

  // 半自动模式
  const [bladeRoller, setBladeRoller] = useState('0');
  const [direction, setDirection] = useState('0');
  const [width, setWidth] = useState('1300');
  const [length, setLength] = useState('10000');
  const [thickness, setThickness] = useState('10');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [lastConfig, setLastConfig] = useState(null);

  // Topics
  const [pumpTopic, setPumpTopic] = useState(null);
  const [chassisTopic, setChassisTopic] = useState(null);
  const [armTopic, setArmTopic] = useState(null);

  // 连接ROS2
  const connectROS = () => {
    setIsConnecting(true);
    
    const newRos = new ROSLIB.Ros({
      url: rosUrl
    });

    const timeout = setTimeout(() => {
      newRos.close();
      toast.error("连接超时，请检查ROS2服务器");
      setIsConnecting(false);
    }, 10000);

    newRos.on('connection', () => {
      clearTimeout(timeout);
      console.log('✓ 连接成功');
      setRos(newRos);
      setIsConnected(true);
      setIsConnecting(false);
      toast.success("已成功连接到ROS2服务器");

      // 初始化Topics
      const pump = new ROSLIB.Topic({
        ros: newRos,
        name: '/pump_control',
        messageType: 'web_connect/msg/Pump'
      });
      setPumpTopic(pump);

      const chassis = new ROSLIB.Topic({
        ros: newRos,
        name: '/chassis_control',
        messageType: 'web_connect/msg/Chassis'
      });
      setChassisTopic(chassis);

      const arm = new ROSLIB.Topic({
        ros: newRos,
        name: '/arm_control',
        messageType: 'web_connect/msg/Arm'
      });
      setArmTopic(arm);
    });

    newRos.on('error', (error) => {
      clearTimeout(timeout);
      console.error('✗ 连接错误:', error);
      toast.error("连接失败，请检查ROS2服务器地址");
      setIsConnecting(false);
    });

    newRos.on('close', () => {
      console.log('连接已关闭');
      setIsConnected(false);
      setRos(null);
    });
  };

  // 断开连接
  const disconnectROS = () => {
    if (ros) {
      ros.close();
      setRos(null);
      setIsConnected(false);
      setPumpTopic(null);
      setChassisTopic(null);
      setArmTopic(null);
      toast.info("已断开连接");
    }
  };

  // 调用Service的通用函数
  const callService = (serviceName, serviceType, request) => {
    return new Promise((resolve, reject) => {
      if (!ros) {
        reject(new Error('未连接到ROS2'));
        return;
      }

      const service = new ROSLIB.Service({
        ros: ros,
        name: serviceName,
        serviceType: serviceType
      });

      const rosRequest = new ROSLIB.ServiceRequest(request);

      service.callService(rosRequest, 
        (result) => {
          console.log('Service调用成功:', result);
          resolve(result);
        },
        (error) => {
          console.error('Service调用失败:', error);
          reject(new Error(error));
        }
      );
    });
  };

  // 开关机
  const handlePowerControl = async (establish) => {
    try {
      const response = await callService(
        '/connection_establish',
        'web_connect/srv/Establish',
        { establish }
      );
      
      if (response.establish_ack === 1) {
        toast.success(establish === 1 ? "开机成功" : "关机成功");
      } else {
        toast.error("操作失败");
      }
    } catch (error) {
      toast.error("操作失败: " + error.message);
    }
  };

  // 底盘使能
  const handleChassisEnable = async () => {
    try {
      const motor_cmd = chassisEnabled ? 0 : 1;
      const response = await callService(
        '/chassis_enable',
        'web_connect/srv/Enable',
        { motor_cmd }
      );
      
      if (response.motor_ack === 1) {
        setChassisEnabled(!chassisEnabled);
        toast.success(chassisEnabled ? "底盘已禁用" : "底盘已使能");
      } else {
        toast.error("底盘使能操作失败");
      }
    } catch (error) {
      toast.error("底盘使能失败: " + error.message);
    }
  };

  // 机械臂使能
  const handleArmEnable = async () => {
    try {
      const motor_cmd = armEnabled ? 0 : 1;
      const response = await callService(
        '/arm_enable',
        'web_connect/srv/Enable',
        { motor_cmd }
      );
      
      if (response.arm_ack === 1) {
        setArmEnabled(!armEnabled);
        toast.success(armEnabled ? "机械臂已禁用" : "机械臂已使能");
      } else {
        toast.error("机械臂使能操作失败");
      }
    } catch (error) {
      toast.error("机械臂使能失败: " + error.message);
    }
  };

  // 泵控制
  const handlePumpSwitch = () => {
    if (!pumpTopic) {
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

  // 底盘控制发布
  const publishChassisControl = (x, y, z) => {
    if (!chassisTopic) return;

    const message = new ROSLIB.Message({
      x_speed: x,
      y_speed: y,
      z_speed: z
    });

    chassisTopic.publish(message);
  };

  // 机械臂控制发布
  const publishArmControl = () => {
    if (!armTopic) return;

    const message = new ROSLIB.Message({
      yaw_angle: yawAngle,
      roll_angle: rollAngle,
      updown_angle: updownAngle,
      arm_reset: 0
    });

    armTopic.publish(message);
  };

  // 机械臂复位
  const handleArmReset = () => {
    if (!armTopic) {
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

  // 半自动模式提交
  const handleSemiAutoSubmit = async () => {
    try {
      const config = {
        blade_roller: parseInt(bladeRoller),
        direction: parseInt(direction),
        width: parseFloat(width),
        length: parseFloat(length),
        thickness: parseFloat(thickness)
      };

      const response = await callService(
        '/semi_mode',
        'web_connect/srv/Semi',
        config
      );

      if (response.ack === 1) {
        setIsConfigured(true);
        setIsStopped(false);
        setLastConfig(config);
        toast.success("半自动模式配置成功");
      } else {
        toast.error("配置失败");
      }
    } catch (error) {
      toast.error("配置失败: " + error.message);
    }
  };

  // 停止
  const handleStop = async (stopCmd) => {
    try {
      const response = await callService(
        '/stop',
        'web_connect/srv/Stop',
        { stop_cmd: stopCmd }
      );

      if (response.stop_ack === 1) {
        setIsStopped(true);
        const messages = ["已停止", "已发送紧急停止", "需要更换料筒"];
        toast.success(messages[stopCmd] || "已停止");
      } else {
        toast.error("停止失败");
      }
    } catch (error) {
      toast.error("停止失败: " + error.message);
    }
  };

  // 继续施工
  const handleContinue = async () => {
    if (!lastConfig) {
      toast.error("没有上次的配置");
      return;
    }

    try {
      const response = await callService(
        '/semi_mode',
        'web_connect/srv/Semi',
        lastConfig
      );

      if (response.ack === 1) {
        setIsStopped(false);
        toast.success("继续施工");
      } else {
        toast.error("继续失败");
      }
    } catch (error) {
      toast.error("继续失败: " + error.message);
    }
  };

  // 切换模式
  const handleModeChange = async (value) => {
    if (!isConnected) {
      toast.error("未连接到ROS");
      return;
    }

    try {
      const mode_cmd = value === "manual" ? 1 : 2;
      const response = await callService(
        '/machine_mode',
        'web_connect/srv/Mode',
        { mode_cmd }
      );

      if (response.mode_ack === 1) {
        toast.success(value === "manual" ? "已切换到手动模式" : "已切换到半自动模式");
      } else {
        toast.error("模式切换失败");
      }
    } catch (error) {
      toast.error("模式切换失败: " + error.message);
    }
  };

  // 实时发布机械臂控制
  useEffect(() => {
    if (armEnabled) {
      publishArmControl();
    }
  }, [yawAngle, rollAngle, updownAngle, armEnabled]);

  return (
    <div className="p-6">
      {/* 连接栏 */}
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
            {!isConnected ? (
              <Button onClick={connectROS} disabled={isConnecting}>
                {isConnecting ? "连接中..." : "连接"}
              </Button>
            ) : (
              <Button onClick={disconnectROS} variant="destructive">
                断开
              </Button>
            )}
          </div>
          
          {isConnected && (
            <div className="flex gap-2 mt-4">
              <Button onClick={() => handlePowerControl(1)} variant="outline">
                开机
              </Button>
              <Button onClick={() => handlePowerControl(0)} variant="outline">
                关机
              </Button>
            </div>
          )}
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
                          onMouseDown={() => { setXSpeed(0.5); publishChassisControl(0.5, ySpeed, zSpeed); }}
                          onMouseUp={() => { setXSpeed(0); publishChassisControl(0, ySpeed, zSpeed); }}
                          onMouseLeave={() => { setXSpeed(0); publishChassisControl(0, ySpeed, zSpeed); }}
                        >
                          ↑
                        </Button>
                      </div>
                      <Button
                        onMouseDown={() => { setYSpeed(-0.5); publishChassisControl(xSpeed, -0.5, zSpeed); }}
                        onMouseUp={() => { setYSpeed(0); publishChassisControl(xSpeed, 0, zSpeed); }}
                        onMouseLeave={() => { setYSpeed(0); publishChassisControl(xSpeed, 0, zSpeed); }}
                      >
                        ←
                      </Button>
                      <Button
                        onMouseDown={() => { setXSpeed(-0.5); publishChassisControl(-0.5, ySpeed, zSpeed); }}
                        onMouseUp={() => { setXSpeed(0); publishChassisControl(0, ySpeed, zSpeed); }}
                        onMouseLeave={() => { setXSpeed(0); publishChassisControl(0, ySpeed, zSpeed); }}
                      >
                        ↓
                      </Button>
                      <Button
                        onMouseDown={() => { setYSpeed(0.5); publishChassisControl(xSpeed, 0.5, zSpeed); }}
                        onMouseUp={() => { setYSpeed(0); publishChassisControl(xSpeed, 0, zSpeed); }}
                        onMouseLeave={() => { setYSpeed(0); publishChassisControl(xSpeed, 0, zSpeed); }}
                      >
                        →
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onMouseDown={() => { setZSpeed(30); publishChassisControl(xSpeed, ySpeed, 30); }}
                        onMouseUp={() => { setZSpeed(0); publishChassisControl(xSpeed, ySpeed, 0); }}
                        onMouseLeave={() => { setZSpeed(0); publishChassisControl(xSpeed, ySpeed, 0); }}
                      >
                        ↺ 左转
                      </Button>
                      <Button
                        className="flex-1"
                        onMouseDown={() => { setZSpeed(-30); publishChassisControl(xSpeed, ySpeed, -30); }}
                        onMouseUp={() => { setZSpeed(0); publishChassisControl(xSpeed, ySpeed, 0); }}
                        onMouseLeave={() => { setZSpeed(0); publishChassisControl(xSpeed, ySpeed, 0); }}
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
