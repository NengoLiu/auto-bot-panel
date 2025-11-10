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

  return (
    <div className="flex flex-col h-screen">
      {/* Connection Bar */}
      <ConnectionBar
        isConnected={isConnected}
        rosUrl={rosUrl}
        onUrlChange={setRosUrl}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnecting={isConnecting}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="manual" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="manual">手动模式</TabsTrigger>
            <TabsTrigger value="semiauto">半自动模式</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <ManualControl
                  chassisEnabled={chassisEnabled}
                  armEnabled={armEnabled}
                  isConnected={isConnected}
                  onChassisToggle={handleChassisToggle}
                  onArmToggle={handleArmToggle}
                />
                <ChassisControl
                  isEnabled={chassisEnabled}
                  isConnected={isConnected}
                />
              </div>
              <div>
                <ArmControl
                  isEnabled={armEnabled}
                  isConnected={isConnected}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="semiauto" className="space-y-6">
            <div className="flex justify-center">
              <SemiAutoControl isConnected={isConnected} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Manual;
