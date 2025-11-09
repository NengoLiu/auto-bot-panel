import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ros2Connection } from "@/lib/ros2Connection";
import { Power, Cpu, Droplets } from "lucide-react";

interface ManualControlProps {
  isConnected: boolean;
}

export const ManualControl = ({ isConnected }: ManualControlProps) => {
  const { toast } = useToast();
  const [chassisEnabled, setChassisEnabled] = useState(false);
  const [armEnabled, setArmEnabled] = useState(false);
  const [pumpEnabled, setPumpEnabled] = useState(false);
  const [pumpSpeed, setPumpSpeed] = useState([0]);
  const [pumpFluid, setPumpFluid] = useState([0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChassisEnable = async () => {
    if (!isConnected) {
      toast({
        title: "未连接",
        description: "请先连接到ROS2服务器",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await ros2Connection.callChassisEnable({
        motor_cmd: chassisEnabled ? 0 : 1,
      });

      const stateMessages = ['未使能', '使能成功', '电机故障'];
      const message = stateMessages[response.current_state] || '未知状态';

      if (response.motor_ack === 1) {
        setChassisEnabled(response.current_state === 1);
        toast({
          title: "底盘操作成功",
          description: message,
          variant: response.current_state === 2 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "底盘操作失败",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArmEnable = async () => {
    if (!isConnected) {
      toast({
        title: "未连接",
        description: "请先连接到ROS2服务器",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await ros2Connection.callArmEnable({
        motor_cmd: armEnabled ? 0 : 1,
      });

      const stateMessages = ['未使能', '使能成功', '机械臂故障'];
      const message = stateMessages[response.current_state] || '未知状态';

      if (response.arm_ack === 1) {
        setArmEnabled(response.current_state === 1);
        toast({
          title: "机械臂操作成功",
          description: message,
          variant: response.current_state === 2 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "机械臂操作失败",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePumpSwitch = () => {
    if (!isConnected) {
      toast({
        title: "未连接",
        description: "请先连接到ROS2服务器",
        variant: "destructive",
      });
      return;
    }

    const newState = !pumpEnabled;
    setPumpEnabled(newState);

    ros2Connection.publishPumpControl({
      pump_switch: newState ? 1 : 0,
      pump_speed: pumpSpeed[0],
      pump_flud: pumpFluid[0],
    });

    toast({
      title: newState ? "泵已开启" : "泵已关闭",
      description: newState ? "可以调节流速和流量" : "",
    });
  };

  const handlePumpSpeedChange = (value: number[]) => {
    setPumpSpeed(value);
    if (pumpEnabled) {
      ros2Connection.publishPumpControl({
        pump_switch: 1,
        pump_speed: value[0],
        pump_flud: pumpFluid[0],
      });
    }
  };

  const handlePumpFluidChange = (value: number[]) => {
    setPumpFluid(value);
    if (pumpEnabled) {
      ros2Connection.publishPumpControl({
        pump_switch: 1,
        pump_speed: pumpSpeed[0],
        pump_flud: value[0],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="w-5 h-5" />
              底盘使能
            </CardTitle>
            <CardDescription>控制底盘电机状态</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleChassisEnable}
              disabled={isProcessing || !isConnected}
              className="w-full"
              variant={chassisEnabled ? "default" : "secondary"}
              size="lg"
            >
              {chassisEnabled ? "底盘已使能" : "底盘未使能"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              机械臂使能
            </CardTitle>
            <CardDescription>控制机械臂状态</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleArmEnable}
              disabled={isProcessing || !isConnected}
              className="w-full"
              variant={armEnabled ? "default" : "secondary"}
              size="lg"
            >
              {armEnabled ? "机械臂已使能" : "机械臂未使能"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            泵控制
          </CardTitle>
          <CardDescription>控制泵的开关和流速流量</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handlePumpSwitch}
            disabled={!isConnected}
            className="w-full"
            variant={pumpEnabled ? "default" : "secondary"}
            size="lg"
          >
            {pumpEnabled ? "泵已开启" : "泵已关闭"}
          </Button>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>流速 (ml/s)</Label>
                <span className="text-sm font-medium">{pumpSpeed[0]} ml/s</span>
              </div>
              <Slider
                value={pumpSpeed}
                onValueChange={handlePumpSpeedChange}
                max={200}
                step={1}
                disabled={!pumpEnabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>流量 (ml)</Label>
                <span className="text-sm font-medium">{pumpFluid[0]} ml</span>
              </div>
              <Slider
                value={pumpFluid}
                onValueChange={handlePumpFluidChange}
                max={12}
                step={0.1}
                disabled={!pumpEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
