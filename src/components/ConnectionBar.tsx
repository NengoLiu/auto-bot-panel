import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wifi, WifiOff } from "lucide-react";

interface ConnectionBarProps {
  isConnected: boolean;
  rosUrl: string;
  onUrlChange: (url: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export const ConnectionBar = ({
  isConnected,
  rosUrl,
  onUrlChange,
  onConnect,
  onDisconnect,
  isConnecting,
}: ConnectionBarProps) => {
  return (
    <div className="h-16 bg-card border-b border-border px-6 flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <Label htmlFor="ros-url" className="whitespace-nowrap text-sm font-medium">
          ROS2 WebSocket URL:
        </Label>
        <Input
          id="ros-url"
          type="text"
          value={rosUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          disabled={isConnected}
          className="max-w-md"
          placeholder="ws://192.168.137.96:9090"
        />
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-success" />
          ) : (
            <WifiOff className="w-5 h-5 text-muted-foreground" />
          )}
          <span className={`text-sm font-medium ${isConnected ? 'text-success' : 'text-muted-foreground'}`}>
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>
        
        {isConnected ? (
          <Button 
            onClick={onDisconnect} 
            variant="destructive"
            size="sm"
          >
            断开连接
          </Button>
        ) : (
          <Button 
            onClick={onConnect} 
            disabled={isConnecting}
            size="sm"
          >
            {isConnecting ? '连接中...' : '建立连接'}
          </Button>
        )}
      </div>
    </div>
  );
};
