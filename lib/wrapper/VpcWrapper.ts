import * as ec2 from "aws-cdk-lib/aws-ec2";
import { WrapperBase, WrapperBaseProps } from "./WrapperBase";

interface Props extends WrapperBaseProps {
  vpcId: string;
  subnetPropsList: {
    cidrBlock: string;
    availabilityZone: string;
  }[];
  internetGatewayId: string;
}

export class VpcWrapper extends WrapperBase {
  public vpc: ec2.IVpc;
  private subnetPropsList: {
    cidrBlock: string;
    availabilityZone: string;
  }[];
  private vpcId: string;
  public subnets: ec2.PublicSubnet[];
  public securityGroup: ec2.SecurityGroup;
  private internetGatewayId: string;

  public constructor(props: Props) {
    super(props);
    this.initialize(props);
  }

  private readonly initialize = (props: Props): void => {
    this.setAdditionalValues(props);
    this.getVpc();
    this.createSubnets();
    this.addRoute();
    this.createSecurityGroup();
  };

  private readonly setAdditionalValues = (props: Props): void => {
    const { vpcId, subnetPropsList, internetGatewayId } = props;

    this.vpcId = vpcId;
    this.subnetPropsList = subnetPropsList;
    this.internetGatewayId = internetGatewayId;
  };

  private readonly getVpc = (): void => {
    const availabilityZones = new Set<string>();
    this.subnetPropsList.forEach((subnetProps) => {
      availabilityZones.add(subnetProps.availabilityZone);
    });

    this.vpc = ec2.Vpc.fromVpcAttributes(this.scope, `${this.appId}-vpc`, {
      vpcId: this.vpcId,
      availabilityZones: [...availabilityZones],
    });
  };

  private readonly createSubnets = (): void => {
    this.subnets = this.subnetPropsList.map((subnetProps, index) => {
      const subnetName = `${this.appId}-subnet${index + 1}`;
      return new ec2.PublicSubnet(this.scope, subnetName, {
        vpcId: this.vpc.vpcId,
        availabilityZone: subnetProps.availabilityZone,
        cidrBlock: subnetProps.cidrBlock,
      });
    });
  };

  private readonly addRoute = (): void => {
    this.subnets.forEach((subnet) => {
      subnet.addRoute("internet-gateway-route", {
        routerType: ec2.RouterType.GATEWAY,
        routerId: this.internetGatewayId,
      });
    });
  };

  private readonly createSecurityGroup = (): void => {
    const securityGroupId = `${this.appId}-sg`;
    this.securityGroup = new ec2.SecurityGroup(this.scope, securityGroupId, {
      vpc: this.vpc,
      securityGroupName: securityGroupId,
      allowAllOutbound: false,
    });
    const http = ec2.Port.tcp(80);
    const https = ec2.Port.tcp(443);
    this.securityGroup.addIngressRule(ec2.Peer.anyIpv4(), http);
    this.securityGroup.addEgressRule(ec2.Peer.anyIpv4(), http);
    this.securityGroup.addEgressRule(ec2.Peer.anyIpv4(), https);
  };
}
