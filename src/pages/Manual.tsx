import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualControl } from "@/components/ManualControl";
import { SemiAutoControl } from "@/components/SemiAutoControl";
import { ros2Connection } from "@/lib/ros2Connection";
import { toast } from "sonner";

interface ManualProps {
  isConnected: boolean;
}

const Manual = ({ isConnected }: ManualProps) => {
  const handleTabChange = async (value: string) => {
    if (!isConnected) {
      toast.error("未连接到ROS");
      return;
    }

    try {
      const mode_cmd = value === "manual" ? 1 : 2; // 1: 手动模式, 2: 半自动
      const response = await ros2Connection.callMachineMode({ mode_cmd });
      
      if (response.mode_ack === 1) {
        toast.success(value === "manual" ? "已切换到手动模式" : "已切换到半自动模式");
      } else {
        toast.error("模式切换失败");
      }
    } catch (error) {
      console.error("Failed to switch mode:", error);
      toast.error("模式切换失败");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">手动/半自动施工</h1>
      
      <Tabs defaultValue="manual" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manual">手动</TabsTrigger>
          <TabsTrigger value="semi-auto">半自动</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="mt-6">
          <ManualControl isConnected={isConnected} />
        </TabsContent>
        
        <TabsContent value="semi-auto" className="mt-6">
          <SemiAutoControl isConnected={isConnected} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manual;
