#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import * as dotenv from "dotenv";
import { CdkPipelineStack } from "../lib/stack/CdkPipelineStack";

dotenv.config({ path: path.join(__dirname, "..", ".env") });
const appId = `${process.env.APP_NAME!}-${process.env.ENV_NAME!}`;

const app = new cdk.App();

const cidrBlocks = process.env.CIDR_BLOCKS!.split(",");
const availabilityZones = process.env.AVAILABILITY_ZONES!.split(",");
const subnetPropsList = cidrBlocks.map((cidrBlock, index) => {
  return {
    cidrBlock,
    availabilityZone: availabilityZones[index],
  };
});

new CdkPipelineStack(app, `${appId}-stack`, {
  appName: process.env.APP_NAME!,
  envName: process.env.ENV_NAME!,
  repoOwnerName: process.env.REPO_OWNER_NAME!,
  repoName: process.env.REPO_NAME!,
  branchName: process.env.BRANCH_NAME!,
  connectionId: process.env.CONNECTION_ID!,
  desiredCount: Number(process.env.DESIRED_COUNT!),
  minHealthyPercent: Number(process.env.MIN_HEALTHY_PERCENT!),
  maxHealthyPercent: Number(process.env.MAX_HEALTHY_PERCENT!),
  cpu: Number(process.env.CPU!),
  memoryLimitMiB: Number(process.env.MEMORY_LIMIT_MIB),
  isAutoScalable: process.env.IS_AUTO_SCALABLE === "TRUE",
  minCapacity: process.env.MIN_CAPACITY
    ? Number(process.env.MIN_CAPACITY)
    : undefined,
  maxCapacity: process.env.MAX_CAPACITY
    ? Number(process.env.MAX_CAPACITY)
    : undefined,
  cpuScaling: process.env.CPU_SCALING
    ? Number(process.env.CPU_SCALING)
    : undefined,
  memoryScaling: process.env.MEMORY_SCALING
    ? Number(process.env.MEMORY_SCALING)
    : undefined,
  listenerRulePathPatterns: process.env.LISTENER_RULE_PATH_PATTERNS!.split(","),
  healthcheckPath: process.env.HEALTHCHECK_PATH!,
  healthCheckTimeout: Number(process.env.HEALTH_CHECK_TIMEOUT!),
  healthCheckInterval: Number(process.env.HEALTH_CHECK_INTERVAL!),
  vpcId: process.env.VPC_ID!,
  subnetPropsList: subnetPropsList,
  internetGatewayId: process.env.INTERNET_GATEWAY_ID!,
  listenerId: process.env.LISTENER_ID!,
  albSecurityGroupId: process.env.ALB_SECURITY_GROUP_ID!,
  listenerRulePriority: Number(process.env.LISTENER_RULE_PRIORITY!),
  alertEmailAddresses: process.env.ALERT_EMAIL_ADDRESSES!.split(","),
  alarmActionsEnabled: process.env.ALARM_ACTIONS_ENABLED === "TRUE",
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
  },
  terminationProtection: true,
});
