import ROSLIB from 'roslib';

export interface ConnectionEstablishRequest {
  establish: number; // 0: 关机, 1: 开机
}

export interface ConnectionEstablishResponse {
  establish_ack: number; // 0/1
  current_state: number; // 0: 关机, 1: 开机, 2: 机器故障
}

export interface EnableRequest {
  motor_cmd: number; // 0: 未使能, 1: 使能, 2: 紧急故障
}

export interface ChassisEnableResponse {
  motor_ack: number; // 0/1
  current_state: number; // 0: 未使能, 1: 使能成功, 2: 电机故障
}

export interface ArmEnableResponse {
  arm_ack: number; // 0/1
  current_state: number; // 0: 未使能, 1: 使能成功, 2: 机械臂故障
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

export class ROS2Connection {
  private ros: ROSLIB.Ros | null = null;
  private connectionTopic: ROSLIB.Topic | null = null;
  private pumpTopic: ROSLIB.Topic | null = null;
  private chassisTopic: ROSLIB.Topic | null = null;
  private armTopic: ROSLIB.Topic | null = null;

  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ros = new ROSLIB.Ros({
        url: url
      });

      this.ros.on('connection', () => {
        console.log('Connected to ROS2 websocket server.');
        resolve();
      });

      this.ros.on('error', (error: any) => {
        console.log('Error connecting to ROS2 websocket server: ', error);
        reject(error);
      });

      this.ros.on('close', () => {
        console.log('Connection to ROS2 websocket server closed.');
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
      serviceType: 'Establish'
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
      serviceType: 'Enable'
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
      serviceType: 'Enable'
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
        messageType: 'Pump'
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
        messageType: 'Chassis'
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
        messageType: 'Arm'
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
      serviceType: 'Semi'
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
}

export const ros2Connection = new ROS2Connection();
