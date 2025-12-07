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
    <div className="h-8 bg-card border-b border-border px-2 flex items-center gap-1.5 shrink-0">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-[10px] text-muted-foreground shrink-0">ROS2:</span>
        <Input
          type="text"
          value={rosUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          disabled={isConnected}
          className="h-6 text-[11px] max-w-[180px] px-1.5"
          placeholder="ws://192.168.137.96:9090"
        />
      </div>
      
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-0.5">
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span className={`text-[10px] ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
            {isConnected ? '已连' : '断开'}
          </span>
        </div>
        
        {isConnected ? (
          <Button 
            onClick={onDisconnect} 
            variant="destructive"
            size="sm"
            className="h-6 text-[10px] px-1.5"
          >
            断开
          </Button>
        ) : (
          <Button 
            onClick={onConnect} 
            disabled={isConnecting}
            size="sm"
            className="h-6 text-[10px] px-1.5"
          >
            {isConnecting ? '...' : '连接'}
          </Button>
        )}
      </div>
    </div>
  );
};