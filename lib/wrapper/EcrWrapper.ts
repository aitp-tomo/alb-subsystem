import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import * as ecrDeploy from "cdk-ecr-deployment";
import * as path from "path";
import { WrapperBase, WrapperBaseProps } from "./WrapperBase";

interface Props extends WrapperBaseProps {
  account: string;
  region: string;
}

export class EcrWrapper extends WrapperBase {
  private account: string;
  private region: string;
  private repository: ecr.Repository;
  public dockerImageAsset: ecrAssets.DockerImageAsset;

  public constructor(props: Props) {
    super(props);

    this.initialize(props);
  }

  private readonly initialize = (props: Props): void => {
    this.setAdditionalValues(props);
    this.createRepository();
    this.createDockerImageAsset();
    this.deployDockerImage();
  };

  private readonly setAdditionalValues = (props: Props): void => {
    const { account, region } = props;

    this.account = account;
    this.region = region;
  };

  private readonly createRepository = (): void => {
    const id = `${this.appId}-ecr-repo`;
    this.repository = new ecr.Repository(this.scope, id, {
      repositoryName: id,
    });
  };

  private readonly createDockerImageAsset = (): void => {
    const id = `${this.appId}-docker-image-asset`;
    this.dockerImageAsset = new ecrAssets.DockerImageAsset(this.scope, id, {
      directory: path.join(__dirname, "..", "asset"),
      platform: ecrAssets.Platform.LINUX_AMD64,
      assetName: id,
    });
  };

  private readonly deployDockerImage = (): void => {
    new ecrDeploy.ECRDeployment(
      this.scope,
      `${this.appId}-deploy-docker-image`,
      {
        src: new ecrDeploy.DockerImageName(this.dockerImageAsset.imageUri),
        dest: new ecrDeploy.DockerImageName(
          `${this.account}.dkr.ecr.${this.region}.amazonaws.com/${this.repository.repositoryName}:latest`
        ),
      }
    );
  };
}
