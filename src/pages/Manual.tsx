import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualControl } from "@/components/ManualControl";

interface ManualProps {
  isConnected: boolean;
}

const Manual = ({ isConnected }: ManualProps) => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">手动/半自动施工</h1>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manual">手动</TabsTrigger>
          <TabsTrigger value="semi-auto">半自动</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="mt-6">
          <ManualControl isConnected={isConnected} />
        </TabsContent>
        
        <TabsContent value="semi-auto" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            半自动模式开发中...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manual;
