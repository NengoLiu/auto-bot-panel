import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">ROS2 机器人控制系统</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>系统概述</CardTitle>
            <CardDescription>ROS2机器人控制平台</CardDescription>
          </CardHeader>
          <CardContent>
            <p>通过Web界面控制机器人底盘、机械臂和泵系统。支持手动和半自动模式。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>连接状态</CardTitle>
            <CardDescription>WebSocket连接</CardDescription>
          </CardHeader>
          <CardContent>
            <p>请在顶部连接栏输入ROS2服务器地址并点击连接。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>控制模式</CardTitle>
            <CardDescription>手动/半自动</CardDescription>
          </CardHeader>
          <CardContent>
            <p>连接成功后，在左侧菜单访问"手动/半自动施工"页面进行机器人控制。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
