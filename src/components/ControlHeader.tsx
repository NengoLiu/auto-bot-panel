import { Menu, Battery, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ControlHeaderProps {
  onMenuClick: () => void;
  isConnected: boolean;
}

export const ControlHeader = ({ onMenuClick, isConnected }: ControlHeaderProps) => {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Left - Menu & Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="rounded-lg border border-border/50"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-sm font-semibold">智驭中枢</h1>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-primary' : 'bg-destructive'}`} />
            <span className="text-[10px] text-muted-foreground">
              {isConnected ? '已连接 ONLINE' : '未连接 OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Right - Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Battery className="w-4 h-4" />
          <span className="text-xs font-medium">87%</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Thermometer className="w-4 h-4" />
          <span className="text-xs font-medium">42° C</span>
        </div>
      </div>
    </header>
  );
};
