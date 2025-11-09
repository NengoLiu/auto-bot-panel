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

export class ROS2Connection {
  private ros: ROSLIB.Ros | null = null;
  private connectionTopic: ROSLIB.Topic | null = null;
  private pumpTopic: ROSLIB.Topic | null = null;

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
}

export const ros2Connection = new ROS2Connection();
