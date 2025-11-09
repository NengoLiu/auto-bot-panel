import ROSLIB from 'roslib';

export interface ConnectionEstablishRequest {
  establish: number; // 0: 关机, 1: 开机
}

export interface ConnectionEstablishResponse {
  establish_ack: number; // 0/1
}

export interface EnableRequest {
  motor_cmd: number; // 0: 未使能, 1: 使能, 2: 紧急故障
}

export interface ChassisEnableResponse {
  motor_ack: number; // 0/1
}

export interface ArmEnableResponse {
  arm_ack: number; // 0/1
}

export interface PumpMessage {
  pump_switch: number; // 0: 关, 1: 开
  pump_speed: number; // 0-200 ml/s
  pump_flud: number; // 0-12 ml
}

export interface ChassisControlMessage {
  x_speed: number; // float64 m/s
  y_speed: number; // float64 m/s
  z_speed: number; // float64 °/s
}

export interface ArmControlMessage {
  yaw_angle: number; // float32 -90 to 90
  roll_angle: number; // float32 -180 to 180
  updown_angle: number; // float32 0-8cm
  arm_reset: number; // uint8 0/1
}

export interface SemiModeRequest {
  blade_roller: number; // 0: 刮涂, 1: 辊涂
  direction: number; // 0: 向左, 1: 向右
  width: number; // float32 0-2600mm
  length: number; // float32 0-20000mm
  thickness: number; // float32 0-20mm
}

export interface SemiModeResponse {
  ack: number; // 0: 执行失败, 1: 确认收到
}

export interface StopRequest {
  stop_cmd: number; // 0: 不发送紧急情况, 1: 发送紧急情况, 2: 需要更换料筒
}

export interface StopResponse {
  stop_ack: number; // 0/1
}

export interface MachineModeRequest {
  mode_cmd: number; // 0: 准备状态/紧急暂停, 1: 手动模式, 2: 半自动
}

export interface MachineModeResponse {
  mode_ack: number; // 0/1
}

export class ROS2Connection {
  private ros: ROSLIB.Ros | null = null;
  private connectionTopic: ROSLIB.Topic | null = null;
  private pumpTopic: ROSLIB.Topic | null = null;
  private chassisTopic: ROSLIB.Topic | null = null;
  private armTopic: ROSLIB.Topic | null = null;

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('正在连接到 ROS2 WebSocket 服务器:', url);
      
      // 添加连接超时
      const timeout = setTimeout(() => {
        if (this.ros) {
          this.ros.close();
        }
        reject(new Error('连接超时：无法连接到 ROS2 服务器。请检查：\n1. ROS2 rosbridge_server 是否已启动\n2. IP 地址和端口是否正确\n3. 网络连接是否正常'));
      }, 10000); // 10秒超时

      this.ros = new ROSLIB.Ros({
        url: url
      });

      this.ros.on('connection', () => {
        clearTimeout(timeout);
        console.log('✓ 成功连接到 ROS2 websocket 服务器');
        resolve();
      });

      this.ros.on('error', (error: any) => {
        clearTimeout(timeout);
        console.error('✗ ROS2 连接错误:', error);
        let errorMessage = '连接失败。';
        
        if (error instanceof Event) {
          errorMessage += '\n请检查：\n1. rosbridge_server 是否运行: ros2 launch rosbridge_server rosbridge_websocket_launch.xml\n2. IP 地址是否正确: ' + url + '\n3. 防火墙是否阻止了端口 9090';
        }
        
        reject(new Error(errorMessage));
      });

      this.ros.on('close', () => {
        console.log('ROS2 websocket 连接已关闭');
      });
    });
  }

  disconnect() {
    if (this.ros) {
      this.ros.close();
      this.ros = null;
      this.connectionTopic = null;
      this.pumpTopic = null;
      this.chassisTopic = null;
      this.armTopic = null;
    }
  }

  isConnected(): boolean {
    return this.ros !== null && this.ros.isConnected;
  }

  async callConnectionEstablish(request: ConnectionEstablishRequest): Promise<ConnectionEstablishResponse> {
    if (!this.ros) throw new Error('Not connected to ROS2');

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/connection_establish',
      serviceType: 'web_connect/srv/Establish'
    });

    return new Promise((resolve, reject) => {
      const rosRequest = new ROSLIB.ServiceRequest(request);
      
      service.callService(rosRequest, (result: any) => {
        resolve(result as ConnectionEstablishResponse);
      }, (error: string) => {
        reject(new Error(error));
      });
    });
  }

  async callChassisEnable(request: EnableRequest): Promise<ChassisEnableResponse> {
    if (!this.ros) throw new Error('Not connected to ROS2');

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/chassis_enable',
      serviceType: 'web_connect/srv/Enable'
    });

    return new Promise((resolve, reject) => {
      const rosRequest = new ROSLIB.ServiceRequest(request);
      
      service.callService(rosRequest, (result: any) => {
        resolve(result as ChassisEnableResponse);
      }, (error: string) => {
        reject(new Error(error));
      });
    });
  }

  async callArmEnable(request: EnableRequest): Promise<ArmEnableResponse> {
    if (!this.ros) throw new Error('Not connected to ROS2');

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/arm_enable',
      serviceType: 'web_connect/srv/Enable'
    });

    return new Promise((resolve, reject) => {
      const rosRequest = new ROSLIB.ServiceRequest(request);
      
      service.callService(rosRequest, (result: any) => {
        resolve(result as ArmEnableResponse);
      }, (error: string) => {
        reject(new Error(error));
      });
    });
  }

  publishPumpControl(message: PumpMessage) {
    if (!this.ros) throw new Error('Not connected to ROS2');

    if (!this.pumpTopic) {
      this.pumpTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/pump_control',
        messageType: 'web_connect/msg/Pump'
      });
    }

    const rosMessage = new ROSLIB.Message(message);
    this.pumpTopic.publish(rosMessage);
  }

  publishChassisControl(message: ChassisControlMessage) {
    if (!this.ros) throw new Error('Not connected to ROS2');

    if (!this.chassisTopic) {
      this.chassisTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/chassis_control',
        messageType: 'web_connect/msg/Chassis'
      });
    }

    const rosMessage = new ROSLIB.Message(message);
    this.chassisTopic.publish(rosMessage);
  }

  publishArmControl(message: ArmControlMessage) {
    if (!this.ros) throw new Error('Not connected to ROS2');

    if (!this.armTopic) {
      this.armTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/arm_control',
        messageType: 'web_connect/msg/Arm'
      });
    }

    const rosMessage = new ROSLIB.Message(message);
    this.armTopic.publish(rosMessage);
  }

  async callSemiMode(request: SemiModeRequest): Promise<SemiModeResponse> {
    if (!this.ros) throw new Error('Not connected to ROS2');

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/semi_mode',
      serviceType: 'web_connect/srv/Semi'
    });

    return new Promise((resolve, reject) => {
      const rosRequest = new ROSLIB.ServiceRequest(request);
      
      service.callService(rosRequest, (result: any) => {
        resolve(result as SemiModeResponse);
      }, (error: string) => {
        reject(new Error(error));
      });
    });
  }

  async callStop(request: StopRequest): Promise<StopResponse> {
    if (!this.ros) throw new Error('Not connected to ROS2');

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/stop',
      serviceType: 'web_connect/srv/Stop'
    });

    return new Promise((resolve, reject) => {
      const rosRequest = new ROSLIB.ServiceRequest(request);
      
      service.callService(rosRequest, (result: any) => {
        resolve(result as StopResponse);
      }, (error: string) => {
        reject(new Error(error));
      });
    });
  }

  async callMachineMode(request: MachineModeRequest): Promise<MachineModeResponse> {
    if (!this.ros) throw new Error('Not connected to ROS2');

    const service = new ROSLIB.Service({
      ros: this.ros,
      name: '/machine_mode',
      serviceType: 'web_connect/srv/Mode'
    });

    return new Promise((resolve, reject) => {
      const rosRequest = new ROSLIB.ServiceRequest(request);
      
      service.callService(rosRequest, (result: any) => {
        resolve(result as MachineModeResponse);
      }, (error: string) => {
        reject(new Error(error));
      });
    });
  }
}

export const ros2Connection = new ROS2Connection();
