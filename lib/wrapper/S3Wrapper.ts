import * as cdk from "aws-cdk-lib";
import { WrapperBase, WrapperBaseProps } from "./WrapperBase";
import * as s3 from "aws-cdk-lib/aws-s3";

interface Props extends WrapperBaseProps {
  suffix: string;
}

export class S3Wrapper extends WrapperBase {
  private suffix: string;
  public bucket: s3.Bucket;

  constructor(props: Props) {
    super(props);
    this.initialize(props);
  }

  private readonly initialize = (props: Props): void => {
    this.setAdditionalValues(props);
    this.createBucket();
  };

  private readonly setAdditionalValues = (props: Props): void => {
    const { suffix } = props;
    this.suffix = suffix;
  };

  private readonly createBucket = (): void => {
    const bucketId = `${this.appId}-log-bucket`;
    this.bucket = new s3.Bucket(this.scope, bucketId, {
      bucketName: `${bucketId}-${this.suffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      publicReadAccess: false,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      versioned: true,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
              transitionAfter: cdk.Duration.days(30 * 3),
            },
          ],
          enabled: true,
        },
        {
          expiration: cdk.Duration.days(365 * 3),
          enabled: true,
        },
      ],
    });
  };
}
