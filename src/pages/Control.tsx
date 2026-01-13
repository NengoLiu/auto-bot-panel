import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ros2Connection } from "@/lib/ros2Connection";
import { lockToLandscape, setImmersiveStatusBar } from "@/lib/screenOrientation";
import { ControlHeader } from "@/components/ControlHeader";
import { ControlSidebar } from "@/components/ControlSidebar";
import { PowerMatrix } from "@/components/PowerMatrix";
import { FluidInject } from "@/components/FluidInject";
import { ChassisControlPanel } from "@/components/ChassisControlPanel";
import { ArmControlPanel } from "@/components/ArmControlPanel";
import { SemiAutoControlPanel } from "@/components/SemiAutoControlPanel";

const MODE_STORAGE_KEY = 'control_current_mode';

const Control = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chassisEnabled, setChassisEnabled] = useState(false);
  const [armEnabled, setArmEnabled] = useState(false);
  // 从sessionStorage恢复模式
  const [currentMode, setCurrentMode] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(MODE_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // 持久化当前模式
  useEffect(() => {
    try {
      if (currentMode) {
        sessionStorage.setItem(MODE_STORAGE_KEY, currentMode);
      } else {
        sessionStorage.removeItem(MODE_STORAGE_KEY);
      }
    } catch {}
  }, [currentMode]);

  useEffect(() => {
    const connected = sessionStorage.getItem("ros2_connected");
    if (!connected) {
      navigate("/");
      return;
    }
    setIsConnected(ros2Connection.isConnected());
    
    // 进入控制页面时锁定为横屏 + 沉浸式状态栏
    lockToLandscape();
    setImmersiveStatusBar();

    // 监听连接状态变化
    const unsubscribe = ros2Connection.addConnectionListener((connected) => {
      setIsConnected(connected);
      if (connected) {
        toast({ title: "已恢复连接", description: "ROS2服务器连接已恢复，模式已同步" });
      } else {
        toast({ title: "连接断开", description: "正在尝试自动重连...", variant: "destructive" });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate, toast]);

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
    toast({ title: mode === "manual" ? "已进入手动模式" : "已进入半自动模式" });
  };

  const isModeActive = currentMode !== null;

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden safe-area-inset">
      <ControlHeader onMenuClick={() => setSidebarOpen(true)} isConnected={isConnected} />
      <ControlSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-auto p-1.5 pb-safe">
        <Tabs value={currentMode || ""} onValueChange={handleModeChange} className="h-full flex flex-col">
          {/* 模式切换标签 - 紧凑设计 */}
          <div className="flex justify-center mb-2">
            <TabsList className="bg-secondary/30 border border-border/50 h-9">
              <TabsTrigger value="manual" className={`font-display tracking-wider text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${!currentMode ? 'opacity-70' : ''}`}>
                <span className="font-semibold">手动</span>
                <span className="text-[9px] opacity-70 ml-1">MANUAL</span>
              </TabsTrigger>
              <TabsTrigger value="semiauto" className={`font-display tracking-wider text-xs px-4 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground ${!currentMode ? 'opacity-70' : ''}`}>
                <span className="font-semibold">半自动</span>
                <span className="text-[9px] opacity-70 ml-1">SEMI</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 未选择模式时显示提示 */}
          {!isModeActive && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-muted-foreground text-center space-y-1">
                <p className="text-base font-semibold">请选择操作模式</p>
                <p className="text-[10px] opacity-70">SELECT MODE</p>
              </div>
            </div>
          )}

          {/* 手动模式 - 横屏两列布局 */}
          <TabsContent value="manual" className="flex-1 m-0 overflow-auto -webkit-overflow-scrolling-touch">
            <div className="min-h-full grid grid-cols-2 gap-2">
              {/* 左侧：底盘控制 + 电源 + 泵控 */}
              <div className="flex flex-col gap-2">
                {/* 电源和泵控 - 水平排列 */}
                <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                  <PowerMatrix 
                    chassisEnabled={chassisEnabled} 
                    armEnabled={armEnabled} 
                    isConnected={isConnected} 
                    onChassisToggle={handleChassisToggle} 
                    onArmToggle={handleArmToggle} 
                  />
                  <FluidInject isConnected={isConnected} />
                </div>
                {/* 底盘控制 */}
                <div className="flex-1 min-h-0">
                  <ChassisControlPanel isEnabled={chassisEnabled} isConnected={isConnected} />
                </div>
              </div>
              
              {/* 右侧：机械臂控制 */}
              <div className="min-h-full">
                <ArmControlPanel isEnabled={armEnabled} isConnected={isConnected} />
              </div>
            </div>
          </TabsContent>

          {/* 半自动模式 */}
          <TabsContent value="semiauto" className="flex-1 m-0 overflow-auto">
            <SemiAutoControlPanel isConnected={isConnected} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Control;
