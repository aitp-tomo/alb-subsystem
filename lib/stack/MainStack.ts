import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackBase, StackBaseProps } from "./StackBase";
import { EcrWrapper } from "../wrapper/EcrWrapper";
import { TaskDefinitionWrapper } from "../wrapper/TaskDefinitionWrapper";
import { VpcWrapper } from "../wrapper/VpcWrapper";
import { EcsWrapper } from "../wrapper/EcsWrapper";
import { AlbWrapper } from "../wrapper/AlbWrapper";
import { S3Wrapper } from "../wrapper/S3Wrapper";
import { KinesisWrapper } from "../wrapper/KinesisWrapper";
import { SnsWrapper } from "../wrapper/SnsWrapper";
import { CloudWatchWrapper } from "../wrapper/CloudWatchWrapper";

export interface MainStackProps extends StackBaseProps {
  desiredCount: number;
  minHealthyPercent: number;
  maxHealthyPercent: number;
  cpu: number;
  memoryLimitMiB: number;
  isAutoScalable: boolean;
  minCapacity?: number;
  maxCapacity?: number;
  cpuScaling?: number;
  memoryScaling?: number;
  healthcheckPath: string;
  healthCheckTimeout: number;
  healthCheckInterval: number;
  vpcId: string;
  subnetPropsList: {
    cidrBlock: string;
    availabilityZone: string;
  }[];
  internetGatewayId: string;
  listenerId: string;
  albSecurityGroupId: string;
  listenerRulePathPatterns: string[];
  listenerRulePriority: number;
  alertEmailAddresses: string[];
  alarmActionsEnabled: boolean;
}

export class MainStack extends StackBase {
  protected desiredCount: number;
  private minHealthyPercent: number;
  private maxHealthyPercent: number;
  private cpu: number;
  private memoryLimitMiB: number;
  private isAutoScalable: boolean;
  private minCapacity?: number;
  private maxCapacity?: number;
  private cpuScaling?: number;
  private memoryScaling?: number;
  private listenerRulePathPatterns: string[];
  private healthcheckPath: string;
  private healthCheckTimeout: number;
  private healthCheckInterval: number;
  private vpcId: string;
  private subnetPropsList: {
    cidrBlock: string;
    availabilityZone: string;
  }[];
  private internetGatewayId: string;
  private listenerId: string;
  private albSecurityGroupId: string;
  private listenerRulePriority: number;
  private alertEmailAddresses: string[];
  private alarmActionsEnabled: boolean;
  private suffix: string;

  public constructor(scope: Construct, id: string, props: MainStackProps) {
    super(scope, id, props);

    this.setAdditionalValues(props);
    this.getSuffix();
    this.createArchitectures();
  }

  private readonly setAdditionalValues = (props: MainStackProps): void => {
    const {
      desiredCount,
      minHealthyPercent,
      maxHealthyPercent,
      cpu,
      memoryLimitMiB,
      isAutoScalable,
      minCapacity,
      maxCapacity,
      cpuScaling,
      memoryScaling,
      listenerRulePathPatterns,
      healthcheckPath,
      healthCheckTimeout,
      healthCheckInterval,
      vpcId,
      subnetPropsList,
      internetGatewayId,
      listenerId,
      albSecurityGroupId,
      listenerRulePriority,
      alertEmailAddresses,
      alarmActionsEnabled,
    } = props;
    this.desiredCount = desiredCount;
    this.minHealthyPercent = minHealthyPercent;
    this.maxHealthyPercent = maxHealthyPercent;
    this.cpu = cpu;
    this.memoryLimitMiB = memoryLimitMiB;
    this.isAutoScalable = isAutoScalable;
    this.minCapacity = minCapacity;
    this.maxCapacity = maxCapacity;
    this.cpuScaling = cpuScaling;
    this.memoryScaling = memoryScaling;
    this.listenerRulePathPatterns = listenerRulePathPatterns;
    this.healthcheckPath = healthcheckPath;
    this.healthCheckTimeout = healthCheckTimeout;
    this.healthCheckInterval = healthCheckInterval;
    this.vpcId = vpcId;
    this.subnetPropsList = subnetPropsList;
    this.internetGatewayId = internetGatewayId;
    this.listenerId = listenerId;
    this.albSecurityGroupId = albSecurityGroupId;
    this.listenerRulePriority = listenerRulePriority;
    this.alertEmailAddresses = alertEmailAddresses;
    this.alarmActionsEnabled = alarmActionsEnabled;
  };

  private readonly createArchitectures = (): void => {
    const commonProps = {
      scope: this,
      appId: this.appId,
    };

    const ecrWrapper = new EcrWrapper({
      ...commonProps,
      account: this.account,
      region: this.region,
    });
    const taskDefinitionWrapper = new TaskDefinitionWrapper({
      ...commonProps,
      cpu: this.cpu,
      memoryLimitMiB: this.memoryLimitMiB,
      ecrWrapper,
    });
    const vpcWrapper = new VpcWrapper({
      ...commonProps,
      vpcId: this.vpcId,
      subnetPropsList: this.subnetPropsList,
      internetGatewayId: this.internetGatewayId,
    });
    const ecsWrapper = new EcsWrapper({
      ...commonProps,
      desiredCount: this.desiredCount,
      minHealthyPercent: this.minHealthyPercent,
      maxHealthyPercent: this.maxHealthyPercent,
      isAutoScalable: this.isAutoScalable,
      minCapacity: this.minCapacity,
      maxCapacity: this.maxCapacity,
      cpuScaling: this.cpuScaling,
      memoryScaling: this.memoryScaling,
      vpcWrapper,
      taskDefinitionWrapper,
    });
    const albWrapper = new AlbWrapper({
      ...commonProps,
      albSecurityGroupId: this.albSecurityGroupId,
      listenerId: this.listenerId,
      account: this.account,
      region: this.region,
      listenerRulePriority: this.listenerRulePriority,
      listenerRulePathPatterns: this.listenerRulePathPatterns,
      healthcheckPath: this.healthcheckPath,
      healthCheckTimeout: this.healthCheckTimeout,
      healthCheckInterval: this.healthCheckInterval,
      vpcWrapper,
      ecsWrapper,
    });
    const s3Wrapper = new S3Wrapper({
      ...commonProps,
      suffix: this.suffix,
    });
    new KinesisWrapper({
      ...commonProps,
      taskDefinitionWrapper,
      s3Wrapper,
    });
    const snsWrapper = new SnsWrapper({
      ...commonProps,
      alertEmailAddresses: this.alertEmailAddresses,
    });
    new CloudWatchWrapper({
      ...commonProps,
      ecsWrapper,
      snsWrapper,
      albWrapper,
      alarmActionsEnabled: this.alarmActionsEnabled,
    });
  };

  private readonly getSuffix = (): void => {
    const shortStackId = cdk.Fn.select(2, cdk.Fn.split("/", this.stackId));
    this.suffix = cdk.Fn.select(4, cdk.Fn.split("-", shortStackId));
  };
}
