import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ros2Connection } from "@/lib/ros2Connection";
import { ControlHeader } from "@/components/ControlHeader";
import { ControlSidebar } from "@/components/ControlSidebar";
import { PowerMatrix } from "@/components/PowerMatrix";
import { FluidInject } from "@/components/FluidInject";
import { ChassisControlPanel } from "@/components/ChassisControlPanel";
import { ArmControlPanel } from "@/components/ArmControlPanel";
import { SemiAutoControlPanel } from "@/components/SemiAutoControlPanel";

const Control = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chassisEnabled, setChassisEnabled] = useState(false);
  const [armEnabled, setArmEnabled] = useState(false);
  const [currentMode, setCurrentMode] = useState<string>("manual");

  useEffect(() => {
    const connected = sessionStorage.getItem("ros2_connected");
    if (!connected) {
      navigate("/");
      return;
    }
    setIsConnected(ros2Connection.isConnected());
  }, [navigate]);

  const handleChassisToggle = () => {
    const newState = !chassisEnabled;
    ros2Connection.sendChassisEnableRequest(newState ? 1 : 0);
    setChassisEnabled(newState);
    toast({ title: newState ? "底盘已启用" : "底盘已禁用" });
  };

  const handleArmToggle = () => {
    const newState = !armEnabled;
    ros2Connection.sendArmEnableRequest(newState ? 1 : 0);
    setArmEnabled(newState);
    toast({ title: newState ? "机械臂已启用" : "机械臂已禁用" });
  };

  const handleModeChange = (mode: string) => {
    if (!isConnected) {
      toast({ title: "未连接", description: "请先连接到ROS2服务器", variant: "destructive" });
      return;
    }
    setCurrentMode(mode);
    const mode_cmd = mode === "manual" ? 1 : 2;
    ros2Connection.sendMachineModeRequest(mode_cmd);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <ControlHeader onMenuClick={() => setSidebarOpen(true)} isConnected={isConnected} />
      <ControlSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-auto p-4">
        <Tabs value={currentMode} onValueChange={handleModeChange} className="space-y-4">
          <div className="flex justify-center">
            <TabsList className="bg-secondary/30 border border-border/50">
              <TabsTrigger value="manual" className="font-display text-xs tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                MANUAL_DRIVE
              </TabsTrigger>
              <TabsTrigger value="semiauto" className="font-display text-xs tracking-wider data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                AUTO_PROC_SEMI
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PowerMatrix chassisEnabled={chassisEnabled} armEnabled={armEnabled} isConnected={isConnected} onChassisToggle={handleChassisToggle} onArmToggle={handleArmToggle} />
              <FluidInject isConnected={isConnected} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChassisControlPanel isEnabled={chassisEnabled} isConnected={isConnected} />
              <ArmControlPanel isEnabled={armEnabled} isConnected={isConnected} />
            </div>
          </TabsContent>

          <TabsContent value="semiauto">
            <SemiAutoControlPanel isConnected={isConnected} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Control;
