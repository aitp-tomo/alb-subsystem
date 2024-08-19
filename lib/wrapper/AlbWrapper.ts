import * as cdk from "aws-cdk-lib";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { EcsWrapper } from "./EcsWrapper";
import { VpcWrapper } from "./VpcWrapper";
import { WrapperBase, WrapperBaseProps } from "./WrapperBase";

interface Props extends WrapperBaseProps {
  albSecurityGroupId: string;
  listenerId: string;
  account: string;
  region: string;
  listenerRulePriority: number;
  listenerRulePathPatterns: string[];
  healthcheckPath: string;
  healthCheckTimeout: number;
  healthCheckInterval: number;
  ecsWrapper: EcsWrapper;
  vpcWrapper: VpcWrapper;
}

export class AlbWrapper extends WrapperBase {
  private albSecurityGroupId: string;
  private listenerId: string;
  private account: string;
  private region: string;
  private listenerRulePriority: number;
  private listenerRulePathPatterns: string[];
  private healthcheckPath: string;
  private healthCheckTimeout: number;
  private healthCheckInterval: number;
  private securityGroup: ec2.ISecurityGroup;
  private listener: elbv2.IApplicationListener;
  private ecsWrapper: EcsWrapper;
  private vpcWrapper: VpcWrapper;
  public targetGroup: elbv2.ApplicationTargetGroup;

  constructor(props: Props) {
    super(props);
    this.initialize(props);
  }

  private readonly initialize = (props: Props): void => {
    this.setAdditionalValues(props);
    this.getSecurityGroup();
    this.getListener();
    this.addTarget();
  };

  private readonly setAdditionalValues = (props: Props): void => {
    const {
      albSecurityGroupId,
      listenerId,
      listenerRulePriority,
      listenerRulePathPatterns,
      account,
      region,
      healthcheckPath,
      healthCheckTimeout,
      healthCheckInterval,
      ecsWrapper,
      vpcWrapper,
    } = props;
    this.albSecurityGroupId = albSecurityGroupId;
    this.listenerId = listenerId;
    this.account = account;
    this.region = region;
    this.listenerRulePriority = listenerRulePriority;
    this.listenerRulePathPatterns = listenerRulePathPatterns;
    this.healthcheckPath = healthcheckPath;
    this.healthCheckTimeout = healthCheckTimeout;
    this.healthCheckInterval = healthCheckInterval;
    this.ecsWrapper = ecsWrapper;
    this.vpcWrapper = vpcWrapper;
  };

  private readonly getSecurityGroup = (): void => {
    this.securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this.scope,
      `${this.appId}-alb-sg`,
      this.albSecurityGroupId
    );
  };

  private readonly getListener = (): void => {
    this.listener = elbv2.ApplicationListener.fromApplicationListenerAttributes(
      this.scope,
      `${this.appId}-listener`,
      {
        listenerArn: `arn:aws:elasticloadbalancing:${this.region}:${this.account}:listener/app/${this.listenerId}`,
        securityGroup: this.securityGroup,
      }
    );
  };

  private readonly addTarget = (): void => {
    const targetGroupId = `${this.appId}-tg`;
    this.targetGroup = new elbv2.ApplicationTargetGroup(
      this.scope,
      targetGroupId,
      {
        healthCheck: {
          enabled: true,
          healthyHttpCodes: "200",
          path: this.healthcheckPath,
          port: "80",
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(this.healthCheckTimeout),
          interval: cdk.Duration.seconds(this.healthCheckInterval),
        },
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,
        targets: [this.ecsWrapper.service],
        vpc: this.vpcWrapper.vpc,
        targetGroupName: targetGroupId,
      }
    );

    this.listener.addTargetGroups(`${this.appId}-listener-tg`, {
      targetGroups: [this.targetGroup],
      conditions: [
        elbv2.ListenerCondition.pathPatterns(this.listenerRulePathPatterns),
      ],
      priority: this.listenerRulePriority,
    });
  };
}
