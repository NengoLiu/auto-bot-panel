import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ros2Connection } from "@/lib/ros2Connection";
import { ConnectionBar } from "@/components/ConnectionBar";
import { ManualControl } from "@/components/ManualControl";
import { ChassisControl } from "@/components/ChassisControl";
import { ArmControl } from "@/components/ArmControl";
import { SemiAutoControl } from "@/components/SemiAutoControl";

const Manual = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [rosUrl, setRosUrl] = useState("ws://192.168.137.96:9090");
  const [isConnecting, setIsConnecting] = useState(false);
  const [chassisEnabled, setChassisEnabled] = useState(false);
  const [armEnabled, setArmEnabled] = useState(false);
  const [currentMode, setCurrentMode] = useState<string>("manual");

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await ros2Connection.connect(rosUrl);
      setIsConnected(true);
      ros2Connection.sendConnectionEstablishRequest(1);
      toast({
        title: "连接成功",
        description: "已连接到 ROS2 服务器"
      });
    } catch (error: any) {
      toast({
        title: "连接失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
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
      description: "已断开与 ROS2 服务器的连接"
    });
  };

  const handleChassisToggle = () => {
    const newState = !chassisEnabled;
    ros2Connection.sendChassisEnableRequest(newState ? 1 : 0);
    setChassisEnabled(newState);
    toast({
      title: newState ? "底盘已启用" : "底盘已禁用",
      description: `底盘状态: ${newState ? "启用" : "禁用"}`
    });
  };

  const handleArmToggle = () => {
    const newState = !armEnabled;
    ros2Connection.sendArmEnableRequest(newState ? 1 : 0);
    setArmEnabled(newState);
    toast({
      title: newState ? "机械臂已启用" : "机械臂已禁用",
      description: `机械臂状态: ${newState ? "启用" : "禁用"}`
    });
  };

  const handleModeChange = (mode: string) => {
    if (!isConnected) {
      toast({
        title: "未连接",
        description: "请先连接到ROS2服务器",
        variant: "destructive"
      });
      return;
    }

    setCurrentMode(mode);
    const mode_cmd = mode === "manual" ? 1 : 2;
    ros2Connection.sendMachineModeRequest(mode_cmd);
    
    toast({
      title: "模式切换",
      description: mode === "manual" ? "已切换到手动模式" : "已切换到半自动模式"
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection Bar - 紧凑版 */}
      <ConnectionBar
        isConnected={isConnected}
        rosUrl={rosUrl}
        onUrlChange={setRosUrl}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnecting={isConnecting}
      />

      {/* Main Content - 无滚动 */}
      <div className="flex-1 p-2 overflow-hidden">
        <Tabs value={currentMode} onValueChange={handleModeChange} className="h-full flex flex-col">
          <TabsList className="grid w-48 grid-cols-2 h-8 shrink-0">
            <TabsTrigger value="manual" className="text-xs h-7">手动模式</TabsTrigger>
            <TabsTrigger value="semiauto" className="text-xs h-7">半自动</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="flex-1 mt-2 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 h-full">
              {/* 左侧: 使能 + 泵控制 */}
              <div className="col-span-1 h-full">
                <ManualControl
                  chassisEnabled={chassisEnabled}
                  armEnabled={armEnabled}
                  isConnected={isConnected}
                  onChassisToggle={handleChassisToggle}
                  onArmToggle={handleArmToggle}
                />
              </div>
              
              {/* 中间: 底盘控制 */}
              <div className="col-span-2 h-full">
                <ChassisControl
                  isEnabled={chassisEnabled}
                  isConnected={isConnected}
                />
              </div>
              
              {/* 右侧: 机械臂控制 */}
              <div className="col-span-1 h-full">
                <ArmControl
                  isEnabled={armEnabled}
                  isConnected={isConnected}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="semiauto" className="flex-1 mt-2 overflow-hidden">
            <SemiAutoControl isConnected={isConnected} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Manual;