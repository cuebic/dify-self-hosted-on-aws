#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DifyOnAwsStack } from '../lib/dify-on-aws-stack';
import { UsEast1Stack } from '../lib/us-east-1-stack';
import { EnvironmentProps } from '../lib/environment-props';

export const props: EnvironmentProps = {
  awsRegion: 'ap-northeast-1',
  //   awsAccount: process.env.CDK_DEFAULT_ACCOUNT!,
  awsAccount: process.env.AWS_ACCOUNT || '',
  // Set Dify version
  difyImageTag: 'main',
  difySandboxImageTag: 'main',
  difyPluginDaemonImageTag: 'stable-20260224',
  // Set plugin-daemon version to stable release
  useCloudFront: false,
  customEcrRepositoryName: 'dify-repo',
  domainName: 'rad.cuebic-sre.work',
  subDomain: process.env.SUBDOMAIN ?? 'dify-sandbox',
  setupEmail: process.env.SETUP_EMAIL ? process.env.SETUP_EMAIL === 'true' : false,
  //   additionalEnvironmentVariables: [
  //     { key: 'CODE_MAX_STRING_LENGTH', value: '800000', targets: ['api'] },
  //     { key: 'TEMPLATE_TRANSFORM_MAX_LENGTH', value: '800000', targets: ['api'] },
  //     { key: 'CODE_MAX_OBJECT_ARRAY_LENGTH', value: '300', targets: ['api'] },
  //     { key: 'CODE_MAX_STRING_ARRAY_LENGTH', value: '300', targets: ['api'] },
  //     { key: 'CODE_MAX_DEPTH', value: '10', targets: ['api'] },
  //     // Notion integration (internal) WIP
  //     { key: 'NOTION_INTEGRATION_TYPE', value: 'internal', targets: ['api'] },
  //     {
  //       key: 'NOTION_INTERNAL_SECRET',
  //       value: { secretName: 'dify-sandbox', field: 'NOTION_INTERNAL_SECRET' },
  //       targets: ['api'],
  //     },
  //   ],
  // コスト管理用タグ
  tags: {
    Project: process.env.SUBDOMAIN ?? 'dify-sandbox',
  },
  // uncomment the below options for less expensive configuration:
  // isRedisMultiAz: false,
  // useNatInstance: true,
  // enableAuroraScalesToZero: true,
  // useFargateSpot: true,

  // Please see EnvironmentProps in lib/environment-props.ts for all the available properties
};

const app = new cdk.App();

let virginia: UsEast1Stack | undefined = undefined;
if ((props.useCloudFront ?? true) && (props.domainName || props.allowedIPv4Cidrs || props.allowedIPv6Cidrs)) {
  // add a unique suffix to prevent collision with different Dify instances in the same account.
  virginia = new UsEast1Stack(app, `DifyOnAwsUsEast1Stack${props.subDomain ? `-${props.subDomain}` : ''}`, {
    env: { region: 'us-east-1', account: props.awsAccount },
    crossRegionReferences: true,
    domainName: props.domainName,
    allowedIpV4AddressRanges: props.allowedIPv4Cidrs,
    allowedIpV6AddressRanges: props.allowedIPv6Cidrs,
  });
}

new DifyOnAwsStack(app, `DifyOnAwsStack${props.subDomain ? `-${props.subDomain}` : ''}`, {
  env: { region: props.awsRegion, account: props.awsAccount },
  crossRegionReferences: true,
  ...props,
  cloudFrontCertificate: virginia?.certificate,
  cloudFrontWebAclArn: virginia?.webAclArn,
});
