import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className="h-10 bg-card border-b border-border px-3 flex items-center gap-2 shrink-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs text-muted-foreground shrink-0">ROS2:</span>
        <Input
          type="text"
          value={rosUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          disabled={isConnected}
          className="h-7 text-xs max-w-[200px]"
          placeholder="ws://192.168.137.96:9090"
        />
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-muted-foreground" />
          )}
          <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
            {isConnected ? '已连接' : '未连接'}
          </span>
        </div>
        
        {isConnected ? (
          <Button 
            onClick={onDisconnect} 
            variant="destructive"
            size="sm"
            className="h-7 text-xs px-2"
          >
            断开
          </Button>
        ) : (
          <Button 
            onClick={onConnect} 
            disabled={isConnecting}
            size="sm"
            className="h-7 text-xs px-2"
          >
            {isConnecting ? '...' : '连接'}
          </Button>
        )}
      </div>
    </div>
  );
};