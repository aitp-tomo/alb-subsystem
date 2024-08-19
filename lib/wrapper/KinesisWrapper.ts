import { S3Wrapper } from "./S3Wrapper";
import { TaskDefinitionWrapper } from "./TaskDefinitionWrapper";
import { WrapperBase, WrapperBaseProps } from "./WrapperBase";
import * as kinesis from "aws-cdk-lib/aws-kinesis";
import * as kinesisfirehose from "aws-cdk-lib/aws-kinesisfirehose";
import * as logs from "aws-cdk-lib/aws-logs";
import * as logsDestinations from "aws-cdk-lib/aws-logs-destinations";
import * as iam from "aws-cdk-lib/aws-iam";

interface Props extends WrapperBaseProps {
  taskDefinitionWrapper: TaskDefinitionWrapper;
  s3Wrapper: S3Wrapper;
}

export class KinesisWrapper extends WrapperBase {
  private taskDefinitionWrapper: TaskDefinitionWrapper;
  private s3Wrapper: S3Wrapper;
  private scourceStream: kinesis.Stream;
  private role: iam.Role;
  private grantedByStream: iam.Grant;

  constructor(props: Props) {
    super(props);
    this.initialize(props);
  }

  private readonly initialize = (props: Props): void => {
    this.setAdditonalValues(props);
    this.createSourceStream();
    this.addSubscriptionFilter();
    this.createRole();
    this.createDeliveryStream();
  };

  private readonly setAdditonalValues = (props: Props): void => {
    const { taskDefinitionWrapper, s3Wrapper } = props;
    this.taskDefinitionWrapper = taskDefinitionWrapper;
    this.s3Wrapper = s3Wrapper;
  };

  private readonly createSourceStream = (): void => {
    const sourceStreamId = `${this.appId}-source-stream`;
    this.scourceStream = new kinesis.Stream(this.scope, sourceStreamId, {
      streamName: sourceStreamId,
      streamMode: kinesis.StreamMode.ON_DEMAND,
    });
  };

  private readonly addSubscriptionFilter = (): void => {
    const filterId = `${this.appId}-filter`;
    this.taskDefinitionWrapper.logGroup.addSubscriptionFilter(filterId, {
      filterName: filterId,
      destination: new logsDestinations.KinesisDestination(this.scourceStream),
      filterPattern: logs.FilterPattern.allEvents(),
    });
  };

  private readonly createRole = (): void => {
    const roleId = `${this.appId}-delivery-stream-role`;
    this.role = new iam.Role(this.scope, roleId, {
      assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com"),
      roleName: roleId,
    });
    this.grantedByStream = this.scourceStream.grant(
      this.role,
      "kinesis:DescribeStream",
      "kinesis:GetShardIterator",
      "kinesis:GetRecords"
    );
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject",
        ],
        effect: iam.Effect.ALLOW,
        resources: [
          this.s3Wrapper.bucket.bucketArn,
          `${this.s3Wrapper.bucket.bucketArn}/*`,
        ],
      })
    );
    this.role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["logs:PutLogEvents"],
        effect: iam.Effect.ALLOW,
        resources: [this.taskDefinitionWrapper.logGroup.logGroupArn],
      })
    );
  };

  private readonly createDeliveryStream = (): void => {
    const deliveryStreamId = `${this.appId}-delivery-stream`;
    const deliveryStream = new kinesisfirehose.CfnDeliveryStream(
      this.scope,
      deliveryStreamId,
      {
        deliveryStreamName: deliveryStreamId,
        deliveryStreamType: "KinesisStreamAsSource",
        kinesisStreamSourceConfiguration: {
          kinesisStreamArn: this.scourceStream.streamArn,
          roleArn: this.role.roleArn,
        },
        s3DestinationConfiguration: {
          bucketArn: this.s3Wrapper.bucket.bucketArn,
          roleArn: this.role.roleArn,
        },
      }
    );
    this.grantedByStream.applyBefore(deliveryStream);
  };
}
