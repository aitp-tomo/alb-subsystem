import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { EcrWrapper } from "./EcrWrapper";
import { WrapperBase, WrapperBaseProps } from "./WrapperBase";

interface Props extends WrapperBaseProps {
  cpu: number;
  memoryLimitMiB: number;
  ecrWrapper: EcrWrapper;
}

export class TaskDefinitionWrapper extends WrapperBase {
  private cpu: number;
  private memoryLimitMiB: number;
  public taskDefinition: ecs.FargateTaskDefinition;
  private ecrWrapper: EcrWrapper;
  public logGroup: logs.LogGroup;
  private logDriver: ecs.AwsLogDriver;
  public containerName: string;

  public constructor(props: Props) {
    super(props);
    this.initialize(props);
  }

  private readonly initialize = (props: Props): void => {
    this.setAdditonalValues(props);
    this.createTaskDefinition();
    this.createLogGroup();
    this.createLogDriver();
    this.addContainer();
  };

  private readonly setAdditonalValues = (props: Props): void => {
    const { cpu, memoryLimitMiB, ecrWrapper } = props;
    this.cpu = cpu;
    this.memoryLimitMiB = memoryLimitMiB;
    this.ecrWrapper = ecrWrapper;
    this.containerName = `${this.appId}-container`;
  };

  private readonly createTaskDefinition = (): void => {
    const taskDefinitionId = `${this.appId}-task-definition`;
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this.scope,
      taskDefinitionId,
      {
        family: `${taskDefinitionId}-family`,
        cpu: this.cpu,
        memoryLimitMiB: this.memoryLimitMiB,
      }
    );
  };

  private readonly createLogGroup = (): void => {
    const logGroupId = `${this.appId}-task-definition-log-group`;
    this.logGroup = new logs.LogGroup(this.scope, logGroupId, {
      logGroupName: logGroupId,
      retention: logs.RetentionDays.TWO_WEEKS,
    });
  };

  private readonly createLogDriver = (): void => {
    this.logDriver = new ecs.AwsLogDriver({
      streamPrefix: this.containerName,
      mode: ecs.AwsLogDriverMode.NON_BLOCKING,
      logGroup: this.logGroup,
    });
  };

  private readonly addContainer = (): void => {
    const image = ecs.EcrImage.fromDockerImageAsset(
      this.ecrWrapper.dockerImageAsset
    );
    this.taskDefinition.addContainer(this.containerName, {
      image,
      containerName: this.containerName,
      cpu: this.cpu,
      memoryLimitMiB: this.memoryLimitMiB,
      portMappings: [
        {
          containerPort: 80,
        },
      ],
      logging: this.logDriver,
    });
  };
}
