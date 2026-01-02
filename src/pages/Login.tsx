import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ros2Connection } from "@/lib/ros2Connection";
import { useToast } from "@/hooks/use-toast";
import { Network, Lock, ArrowRight, Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ipAddress, setIpAddress] = useState("192.168.137.96");
  const [password, setPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!ipAddress) {
      toast({
        title: "错误",
        description: "请输入IP地址",
        variant: "destructive"
      });
      return;
    }

    const rosUrl = `ws://${ipAddress}:9090`;
    setIsConnecting(true);
    try {
      await ros2Connection.connect(rosUrl);
      ros2Connection.sendConnectionEstablishRequest(1);
      toast({
        title: "连接成功",
        description: "已连接到 ROS2 服务器"
      });
      // Store connection info
      sessionStorage.setItem("ros2_connected", "true");
      sessionStorage.setItem("ros2_url", rosUrl);
      navigate("/control");
    } catch (error: any) {
      toast({
        title: "连接失败",
        description: error.message || "无法连接到ROS2服务器",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            SINGULARITY OS V2.0
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
            极致工艺
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            专为环氧、聚氨酯及固化地坪设计，从地下车库到高端厂房，毫米级厚度控制，零误差拼接。
          </p>
        </div>

        {/* Carousel dots placeholder */}
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <span className="w-8 h-1 rounded-full bg-primary" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        </div>
      </div>

      {/* Login Form Section */}
      <div className="bg-card/50 backdrop-blur-sm border-t border-border px-6 py-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="font-display text-xl font-semibold tracking-wider mb-2">WELCOME_BACK</h2>
            <p className="text-muted-foreground text-sm">请输入凭证以访问控制核心</p>
          </div>

          {/* IP Input */}
          <div className="relative">
            <Network className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="192.168.4.1"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="pl-12 h-14 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">IP地址</span>
          </div>

          {/* Connect Button */}
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                连接中...
              </>
            ) : (
              <>
                CONNECT
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            新操作员? <button className="text-accent hover:underline">注册</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
