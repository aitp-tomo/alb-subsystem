import { WrapperBase, WrapperBaseProps } from "./WrapperBase";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { VpcWrapper } from "./VpcWrapper";
import { TaskDefinitionWrapper } from "./TaskDefinitionWrapper";

interface Props extends WrapperBaseProps {
  desiredCount: number;
  minHealthyPercent: number;
  maxHealthyPercent: number;
  isAutoScalable: boolean;
  minCapacity?: number;
  maxCapacity?: number;
  cpuScaling?: number;
  memoryScaling?: number;
  vpcWrapper: VpcWrapper;
  taskDefinitionWrapper: TaskDefinitionWrapper;
}

export class EcsWrapper extends WrapperBase {
  private desiredCount: number;
  private minHealthyPercent: number;
  private maxHealthyPercent: number;
  private isAutoScalable: boolean;
  private minCapacity?: number;
  private maxCapacity?: number;
  private cpuScaling?: number;
  private memoryScaling?: number;
  public service: ecs.FargateService;
  private cluster: ecs.Cluster;
  private vpcWrapper: VpcWrapper;
  private taskDefinitionWrapper: TaskDefinitionWrapper;

  public constructor(props: Props) {
    super(props);

    this.initialize(props);
  }

  private readonly initialize = (props: Props): void => {
    this.setAdditionalValues(props);
    this.createCluster();
    this.createService();
    this.autoScale();
  };

  private readonly setAdditionalValues = (props: Props): void => {
    const {
      desiredCount,
      minHealthyPercent,
      maxHealthyPercent,
      isAutoScalable,
      minCapacity,
      maxCapacity,
      cpuScaling,
      memoryScaling,
      vpcWrapper,
      taskDefinitionWrapper,
    } = props;
    this.desiredCount = desiredCount;
    this.minHealthyPercent = minHealthyPercent;
    this.maxHealthyPercent = maxHealthyPercent;
    this.isAutoScalable = isAutoScalable;
    this.minCapacity = minCapacity;
    this.maxCapacity = maxCapacity;
    this.cpuScaling = cpuScaling;
    this.memoryScaling = memoryScaling;
    this.vpcWrapper = vpcWrapper;
    this.taskDefinitionWrapper = taskDefinitionWrapper;
  };

  private readonly createCluster = (): void => {
    const clusterId = `${this.appId}-cluster`;
    this.cluster = new ecs.Cluster(this.scope, clusterId, {
      clusterName: clusterId,
      containerInsights: true,
      vpc: this.vpcWrapper.vpc,
    });
  };

  private readonly createService = (): void => {
    const serviceId = `${this.appId}-service`;
    this.service = new ecs.FargateService(this.scope, serviceId, {
      serviceName: serviceId,
      cluster: this.cluster,
      taskDefinition: this.taskDefinitionWrapper.taskDefinition,
      assignPublicIp: true,
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,
      },
      securityGroups: [this.vpcWrapper.securityGroup],
      vpcSubnets: { subnets: this.vpcWrapper.subnets },
      desiredCount: this.desiredCount,
      minHealthyPercent: this.minHealthyPercent,
      maxHealthyPercent: this.maxHealthyPercent,
    });
  };

  private readonly autoScale = (): void => {
    if (this.isAutoScalable) {
      const scalableTarget = this.service.autoScaleTaskCount({
        minCapacity: this.minCapacity,
        maxCapacity: this.maxCapacity!,
      });
      if (this.cpuScaling) {
        scalableTarget.scaleOnCpuUtilization(`${this.appId}-cpu-scaling`, {
          targetUtilizationPercent: this.cpuScaling,
        });
      }
      if (this.memoryScaling) {
        scalableTarget.scaleOnMemoryUtilization(
          `${this.appId}-memory-scaling`,
          {
            targetUtilizationPercent: this.memoryScaling,
          }
        );
      }
    }
  };
}
