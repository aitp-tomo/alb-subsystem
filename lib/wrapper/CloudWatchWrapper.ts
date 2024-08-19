import * as cdk from "aws-cdk-lib";
import { AlbWrapper } from "./AlbWrapper";
import { EcsWrapper } from "./EcsWrapper";
import { SnsWrapper } from "./SnsWrapper";
import { WrapperBase, WrapperBaseProps } from "./WrapperBase";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";

interface Props extends WrapperBaseProps {
  ecsWrapper: EcsWrapper;
  snsWrapper: SnsWrapper;
  albWrapper: AlbWrapper;
  alarmActionsEnabled: boolean;
}

export class CloudWatchWrapper extends WrapperBase {
  private ecsWrapper: EcsWrapper;
  private snsWrapper: SnsWrapper;
  private cpuUtilizationAlarm: cloudwatch.Alarm;
  private memoryUtilizationAlarm: cloudwatch.Alarm;
  private unhealthyHostCountAlarm: cloudwatch.Alarm;
  private albWrapper: AlbWrapper;
  private alarmActionsEnabled: boolean;

  constructor(props: Props) {
    super(props);
    this.initialize(props);
  }

  private readonly initialize = (props: Props): void => {
    this.setAdditionalValues(props);
    this.createAlarms();
    this.addAlarmActions();
  };

  private readonly setAdditionalValues = (props: Props): void => {
    const { ecsWrapper, snsWrapper, albWrapper, alarmActionsEnabled } = props;

    this.ecsWrapper = ecsWrapper;
    this.snsWrapper = snsWrapper;
    this.albWrapper = albWrapper;
    this.alarmActionsEnabled = alarmActionsEnabled;
  };

  private readonly createAlarms = (): void => {
    const metricCpuUtilization = this.ecsWrapper.service.metricCpuUtilization();
    const cpuUtilizationAlarmId = `${this.appId}-ecs-service-cpu-util-alarm`;
    this.cpuUtilizationAlarm = this.createAlarm(
      metricCpuUtilization,
      80,
      cpuUtilizationAlarmId
    );

    const metricMemoryUtilization =
      this.ecsWrapper.service.metricMemoryUtilization();
    const memoryUtilizationAlarmId = `${this.appId}-ecs-service-memory-util-alarm`;
    this.memoryUtilizationAlarm = this.createAlarm(
      metricMemoryUtilization,
      80,
      memoryUtilizationAlarmId
    );

    const metricUnhealthyHostCount =
      this.albWrapper.targetGroup.metrics.unhealthyHostCount({
        period: cdk.Duration.minutes(1),
        statistic: cloudwatch.Stats.MAXIMUM,
      });
    const unhealthyHostCountAlarmId = `${this.appId}-tg-unhealthy-host-count-alarm`;
    this.unhealthyHostCountAlarm = this.createAlarm(
      metricUnhealthyHostCount,
      0,
      unhealthyHostCountAlarmId,
      cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    );
  };

  private readonly createAlarm = (
    metric: cloudwatch.Metric,
    threshold: number,
    alarmId: string,
    comparisonOperator?: cloudwatch.ComparisonOperator,
    evaluationPeriods: number = 1
  ): cloudwatch.Alarm => {
    const alarm = new cloudwatch.Alarm(this.scope, alarmId, {
      metric,
      threshold,
      evaluationPeriods,
      actionsEnabled: this.alarmActionsEnabled,
      alarmName: alarmId,
      comparisonOperator,
    });
    return alarm;
  };

  private readonly addAlarmActions = (): void => {
    const alertAction = new cloudwatchActions.SnsAction(
      this.snsWrapper.alertTopic
    );
    this.cpuUtilizationAlarm.addAlarmAction(alertAction);
    this.memoryUtilizationAlarm.addAlarmAction(alertAction);
    this.unhealthyHostCountAlarm.addAlarmAction(alertAction);
  };
}
