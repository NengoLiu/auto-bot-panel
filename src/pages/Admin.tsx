import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ros2Connection } from "@/lib/ros2Connection";
import { packetLogger, PacketLog, FaultRecord } from "@/lib/packetLogger";
import { lockToLandscape, setImmersiveStatusBar } from "@/lib/screenOrientation";
import { 
  AlertTriangle, 
  FileText, 
  FolderKanban, 
  Activity,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Cpu,
  Wrench,
  Zap,
  RotateCcw,
  Loader2
} from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(ros2Connection.isConnected());
  const [logs, setLogs] = useState<PacketLog[]>([]);
  const [faults, setFaults] = useState<FaultRecord[]>([]);
  const [stats, setStats] = useState({ totalSent: 0, noResponseCount: 0, avgResponseTime: 0, unresolvedFaults: 0 });
  const [devClickCount, setDevClickCount] = useState(0);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [zeroingAxis, setZeroingAxis] = useState<number | null>(null);

  const refreshData = useCallback(() => {
    setLogs(packetLogger.getTodayLogs());
    setFaults(packetLogger.getFaults(true));
    setStats(packetLogger.getStats());
  }, []);

  useEffect(() => {
    lockToLandscape();
    setImmersiveStatusBar();
    refreshData();

    const unsubscribe = ros2Connection.addConnectionListener((connected) => {
      setIsConnected(connected);
    });

    // 监听故障事件
    const handleFault = () => refreshData();
    window.addEventListener('robot-fault', handleFault);

    // 定时刷新
    const interval = setInterval(refreshData, 3000);

    return () => {
      unsubscribe();
      window.removeEventListener('robot-fault', handleFault);
      clearInterval(interval);
    };
  }, [refreshData]);

  const handleResolveFault = (id: string) => {
    packetLogger.resolveFault(id);
    refreshData();
    toast({ title: "故障已标记为已解决" });
  };

  // 开发者入口：快速点击版本号5次
  const handleDevClick = () => {
    setDevClickCount(prev => prev + 1);
    if (devClickCount >= 4) {
      setShowDevPanel(true);
      setDevClickCount(0);
      toast({ title: "开发者模式已启用", description: "请谨慎操作" });
    }
    // 3秒后重置点击计数
    setTimeout(() => setDevClickCount(0), 3000);
  };

  const handleZeroset = async (axis: 5 | 6 | 7) => {
    if (!isConnected) {
      toast({ title: "未连接", description: "请先连接到ROS2服务器", variant: "destructive" });
      return;
    }

    setZeroingAxis(axis);
    try {
      const result = await ros2Connection.sendZerosetRequest(axis, 1);
      if (result.zero_set_ack === 1) {
        toast({ title: "归零成功", description: `轴 ${axis} 已完成归零` });
      } else {
        toast({ title: "归零失败", description: `轴 ${axis} 归零响应异常`, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "归零失败", description: String(error), variant: "destructive" });
    } finally {
      setZeroingAxis(null);
    }
  };

  const getFaultIcon = (type: FaultRecord['type']) => {
    switch (type) {
      case 'motor': return <Cpu className="w-4 h-4" />;
      case 'pump': return <Zap className="w-4 h-4" />;
      case 'power': return <Zap className="w-4 h-4" />;
      case 'arm': return <Wrench className="w-4 h-4" />;
      case 'chassis': return <Activity className="w-4 h-4" />;
      case 'no_response': return <WifiOff className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getFaultTypeLabel = (type: FaultRecord['type']) => {
    const labels: Record<string, string> = {
      no_response: '通信超时',
      error: '错误',
      motor: '电机故障',
      pump: '泵故障',
      power: '电源故障',
      arm: '机械臂故障',
      chassis: '底盘故障',
      other: '其他'
    };
    return labels[type] || type;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { hour12: false });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/control")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-display text-sm tracking-wider">管理员面板</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="text-[10px]">
            {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isConnected ? "已连接" : "未连接"}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {/* 隐藏的开发者入口 */}
          <span 
            className="text-[8px] text-muted-foreground/30 cursor-default select-none"
            onClick={handleDevClick}
          >
            v2.0.1
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-2 p-2 border-b border-border/30">
        <div className="cyber-card p-2 text-center">
          <p className="text-[10px] text-muted-foreground">今日发送</p>
          <p className="text-lg font-display text-primary">{stats.totalSent}</p>
        </div>
        <div className="cyber-card p-2 text-center">
          <p className="text-[10px] text-muted-foreground">无响应</p>
          <p className={`text-lg font-display ${stats.noResponseCount > 0 ? 'text-destructive' : 'text-success'}`}>
            {stats.noResponseCount}
          </p>
        </div>
        <div className="cyber-card p-2 text-center">
          <p className="text-[10px] text-muted-foreground">平均响应</p>
          <p className="text-lg font-display text-foreground">{stats.avgResponseTime}ms</p>
        </div>
        <div className="cyber-card p-2 text-center">
          <p className="text-[10px] text-muted-foreground">待处理故障</p>
          <p className={`text-lg font-display ${stats.unresolvedFaults > 0 ? 'text-warning' : 'text-success'}`}>
            {stats.unresolvedFaults}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-2">
        <Tabs defaultValue="faults" className="h-full flex flex-col">
          <TabsList className="bg-secondary/30 border border-border/50 h-8 mx-auto">
            <TabsTrigger value="faults" className="text-xs px-3 h-7">
              <AlertTriangle className="w-3 h-3 mr-1" />故障信息
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs px-3 h-7">
              <FileText className="w-3 h-3 mr-1" />运行日志
            </TabsTrigger>
            <TabsTrigger value="project" className="text-xs px-3 h-7">
              <FolderKanban className="w-3 h-3 mr-1" />工程管理
            </TabsTrigger>
            <TabsTrigger value="status" className="text-xs px-3 h-7">
              <Activity className="w-3 h-3 mr-1" />机器人状态
            </TabsTrigger>
          </TabsList>

          {/* 故障信息 */}
          <TabsContent value="faults" className="flex-1 m-0 mt-2 overflow-hidden">
            <Card className="h-full cyber-card">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  故障记录
                  <span className="text-[10px] text-muted-foreground font-normal">(最近7天)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 h-[calc(100%-3rem)]">
                <ScrollArea className="h-full pr-2">
                  {faults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mb-2 text-success" />
                      <p className="text-sm">暂无故障记录</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {faults.slice().reverse().map((fault) => (
                        <div 
                          key={fault.id} 
                          className={`p-2 rounded border ${fault.resolved ? 'border-border/30 opacity-60' : 'border-warning/50 bg-warning/5'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <div className={`p-1 rounded ${fault.resolved ? 'bg-muted' : 'bg-warning/20 text-warning'}`}>
                                {getFaultIcon(fault.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant={fault.resolved ? "secondary" : "outline"} className="text-[9px]">
                                    {getFaultTypeLabel(fault.type)}
                                  </Badge>
                                  <span className="text-[9px] text-muted-foreground">{formatTime(fault.timestamp)}</span>
                                </div>
                                <p className="text-xs mt-1 truncate">{fault.message}</p>
                                <p className="text-[9px] text-muted-foreground">来源: {fault.source}</p>
                              </div>
                            </div>
                            {!fault.resolved && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] px-2"
                                onClick={() => handleResolveFault(fault.id)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />解决
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 运行日志 */}
          <TabsContent value="logs" className="flex-1 m-0 mt-2 overflow-hidden">
            <Card className="h-full cyber-card">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  今日通信日志
                  <span className="text-[10px] text-muted-foreground font-normal">({logs.length}条)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 h-[calc(100%-3rem)]">
                <ScrollArea className="h-full pr-2">
                  {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">暂无日志记录</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.slice().reverse().slice(0, 100).map((log) => (
                        <div 
                          key={log.id} 
                          className={`p-2 rounded border text-[10px] ${
                            log.error ? 'border-destructive/30 bg-destructive/5' : 'border-border/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{formatTime(log.timestamp)}</span>
                            <Badge variant={log.type === 'service' ? 'default' : 'secondary'} className="text-[8px] h-4">
                              {log.type}
                            </Badge>
                            <span className="font-mono text-primary truncate flex-1">{log.name}</span>
                            {log.responseReceived ? (
                              log.responseTime ? (
                                <span className="flex items-center gap-1 text-success">
                                  <Clock className="w-3 h-3" />
                                  {log.responseTime}ms
                                </span>
                              ) : (
                                <CheckCircle className="w-3 h-3 text-success" />
                              )
                            ) : log.error ? (
                              <span className="flex items-center gap-1 text-destructive">
                                <XCircle className="w-3 h-3" />
                                {log.error}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">等待响应...</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 工程管理 */}
          <TabsContent value="project" className="flex-1 m-0 mt-2 overflow-hidden">
            <Card className="h-full cyber-card">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-accent" />
                  工程管理
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <FolderKanban className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">功能开发中</p>
                  <p className="text-[10px]">工程项目管理、施工记录、历史数据</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 机器人状态 */}
          <TabsContent value="status" className="flex-1 m-0 mt-2 overflow-hidden">
            <Card className="h-full cyber-card">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Activity className="w-4 h-4 text-success" />
                  机器人状态监控
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  {/* 连接状态 */}
                  <div className="p-3 rounded border border-border/50 bg-secondary/20">
                    <p className="text-[10px] text-muted-foreground mb-1">连接状态</p>
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <Wifi className="w-5 h-5 text-success" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-destructive" />
                      )}
                      <span className={`font-display text-sm ${isConnected ? 'text-success' : 'text-destructive'}`}>
                        {isConnected ? '在线' : '离线'}
                      </span>
                    </div>
                  </div>

                  {/* 预留：故障报警 */}
                  <div className="p-3 rounded border border-border/50 bg-secondary/20">
                    <p className="text-[10px] text-muted-foreground mb-1">故障报警</p>
                    <div className="flex items-center gap-2">
                      {stats.unresolvedFaults > 0 ? (
                        <>
                          <AlertTriangle className="w-5 h-5 text-warning animate-pulse" />
                          <span className="font-display text-sm text-warning">{stats.unresolvedFaults}个待处理</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-success" />
                          <span className="font-display text-sm text-success">正常</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 预留状态块 */}
                  <div className="p-3 rounded border border-border/30 bg-secondary/10 opacity-50">
                    <p className="text-[10px] text-muted-foreground mb-1">电机状态</p>
                    <p className="text-xs">待接入</p>
                  </div>
                  <div className="p-3 rounded border border-border/30 bg-secondary/10 opacity-50">
                    <p className="text-[10px] text-muted-foreground mb-1">泵系统</p>
                    <p className="text-xs">待接入</p>
                  </div>
                  <div className="p-3 rounded border border-border/30 bg-secondary/10 opacity-50">
                    <p className="text-[10px] text-muted-foreground mb-1">电源系统</p>
                    <p className="text-xs">待接入</p>
                  </div>
                  <div className="p-3 rounded border border-border/30 bg-secondary/10 opacity-50">
                    <p className="text-[10px] text-muted-foreground mb-1">传感器</p>
                    <p className="text-xs">待接入</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 开发者面板 - 隐藏入口 */}
      {showDevPanel && (
        <div className="fixed inset-0 bg-background/95 z-50 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-destructive/50 bg-destructive/10">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-destructive" />
              <h2 className="font-display text-sm text-destructive">开发者工具</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive" 
              onClick={() => setShowDevPanel(false)}
            >
              关闭
            </Button>
          </div>
          
          <div className="flex-1 p-4">
            <Card className="cyber-card border-destructive/30">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  机械臂归零
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-[10px] text-muted-foreground mb-3">
                  ⚠️ 警告：此操作仅供出厂测试使用，请确保机械臂处于安全位置
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[5, 6, 7].map((axis) => (
                    <Button
                      key={axis}
                      variant="outline"
                      className="h-16 flex flex-col gap-1 border-destructive/30 hover:bg-destructive/10"
                      disabled={!isConnected || zeroingAxis !== null}
                      onClick={() => handleZeroset(axis as 5 | 6 | 7)}
                    >
                      {zeroingAxis === axis ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-5 h-5" />
                      )}
                      <span className="text-xs">轴 {axis} 归零</span>
                    </Button>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground mt-3 text-center">
                  服务: /admin_zeroset_5, /admin_zeroset_6, /admin_zeroset_7
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
