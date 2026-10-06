import path from "node:path";

import { fileURLToPath } from "node:url";

import {
  Arn,
  Aws,
  CfnOutput,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
} from "aws-cdk-lib";

import type { StackProps } from "aws-cdk-lib";

import * as apigw from "aws-cdk-lib/aws-apigateway";

import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";

import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";

import * as ec2 from "aws-cdk-lib/aws-ec2";

import * as iam from "aws-cdk-lib/aws-iam";

import * as lambda from "aws-cdk-lib/aws-lambda";

import * as logs from "aws-cdk-lib/aws-logs";

import * as rds from "aws-cdk-lib/aws-rds";

import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

import { Construct } from "constructs";

export type WarehouseProductionStackProps = StackProps & {
  publicRegistrationEnabled: boolean;
};

export class WarehouseProductionStack extends Stack {
  constructor(
    scope: Construct,

    id: string,

    props: WarehouseProductionStackProps,
  ) {
    super(scope, id, props);

    const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

    const repositoryRoot = path.resolve(currentDirectory, "../../..");

    const vpc = new ec2.Vpc(this, "Vpc", {
      vpcName: "warehouse-production",

      ipAddresses: ec2.IpAddresses.cidr("10.20.0.0/16"),

      maxAzs: 2,

      natGateways: 0,

      subnetConfiguration: [
        {
          name: "application",

          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,

          cidrMask: 24,
        },
      ],
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      "LambdaSecurityGroup",
      {
        vpc,

        description: "Warehouse production Lambda security group",

        allowAllOutbound: true,
      },
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      "DatabaseSecurityGroup",
      {
        vpc,

        description: "Warehouse production PostgreSQL security group",

        allowAllOutbound: false,
      },
    );

    databaseSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL only from Warehouse Lambda",
    );

    const databaseSecret = new secretsmanager.Secret(this, "DatabaseSecret", {
      secretName: "/warehouse/production/database",

      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: "warehouse_app",
        }),

        generateStringKey: "password",

        passwordLength: 40,

        excludePunctuation: true,
      },
    });

    databaseSecret.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const authSecret = new secretsmanager.Secret(this, "AuthSecret", {
      secretName: "/warehouse/production/auth",

      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),

        generateStringKey: "JWT_ACCESS_SECRET",

        passwordLength: 64,

        excludePunctuation: true,
      },
    });

    authSecret.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const databaseEngine = rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.of("17.11", "17"),
    });

    const parameterGroup = new rds.ParameterGroup(
      this,
      "DatabaseParameterGroup",
      {
        engine: databaseEngine,

        parameters: {
          "rds.force_ssl": "1",
        },
      },
    );

    const database = new rds.DatabaseInstance(this, "Database", {
      databaseName: "warehouse_db",

      engine: databaseEngine,

      credentials: rds.Credentials.fromSecret(databaseSecret),

      vpc,

      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },

      securityGroups: [databaseSecurityGroup],

      publiclyAccessible: false,

      multiAz: false,

      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,

        ec2.InstanceSize.MICRO,
      ),

      allocatedStorage: 20,

      maxAllocatedStorage: 100,

      storageType: rds.StorageType.GP3,

      storageEncrypted: true,

      backupRetention: Duration.days(7),

      deleteAutomatedBackups: false,

      deletionProtection: true,

      autoMinorVersionUpgrade: true,

      parameterGroup,

      removalPolicy: RemovalPolicy.SNAPSHOT,
    });

    const databaseUrl = Fn.join("", [
      "postgresql://warehouse_app:",

      databaseSecret.secretValueFromJson("password").unsafeUnwrap(),

      "@",

      database.dbInstanceEndpointAddress,

      ":",

      database.dbInstanceEndpointPort,

      "/warehouse_db?schema=public&sslmode=require",
    ]);

    const jwtAccessSecret = authSecret
      .secretValueFromJson("JWT_ACCESS_SECRET")
      .unsafeUnwrap();

    const apiLogGroup = new logs.LogGroup(this, "ApiLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,

      removalPolicy: RemovalPolicy.RETAIN,
    });

    const apiFunction = new lambda.DockerImageFunction(this, "ApiFunction", {
      functionName: "warehouse-production-api",

      description: "Warehouse SaaS production NestJS API",

      code: lambda.DockerImageCode.fromImageAsset(repositoryRoot, {
        file: "apps/api/Dockerfile.lambda",
        exclude: ["apps/infra/cdk.out", "apps/infra/cdk.out/**"],
      }),

      architecture: lambda.Architecture.X86_64,

      memorySize: 1024,

      timeout: Duration.seconds(28),

      reservedConcurrentExecutions: 0,

      vpc,

      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },

      securityGroups: [lambdaSecurityGroup],

      logGroup: apiLogGroup,

      environment: {
        NODE_ENV: "production",

        DATABASE_URL: databaseUrl,

        JWT_ACCESS_SECRET: jwtAccessSecret,

        JWT_ACCESS_TTL_SECONDS: "900",

        JWT_ISSUER: "warehouse-api",

        JWT_AUDIENCE: "warehouse-web",

        REFRESH_SESSION_TTL_DAYS: "30",

        DEV_SEED_ENABLED: "false",

        PUBLIC_REGISTRATION_ENABLED: props.publicRegistrationEnabled
          ? "true"
          : "false",

        LOG_FORMAT: "json",

        SLOW_REQUEST_MS: "1000",

        OPERATIONS_PENDING_WARN_SECONDS: "60",

        OUTBOX_WORKER_ENABLED: "false",

        DATA_JOBS_WORKER_ENABLED: "false",
      },
    });

    const migrationLogGroup = new logs.LogGroup(this, "MigrationLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,

      removalPolicy: RemovalPolicy.RETAIN,
    });

    const migrationFunction = new lambda.DockerImageFunction(
      this,
      "MigrationFunction",
      {
        functionName: "warehouse-production-migrate",

        description: "Warehouse production Prisma migration runner",

        code: lambda.DockerImageCode.fromImageAsset(repositoryRoot, {
          file: "apps/api/Dockerfile.migrate",
          exclude: ["apps/infra/cdk.out", "apps/infra/cdk.out/**"],
        }),

        architecture: lambda.Architecture.X86_64,

        memorySize: 1024,

        timeout: Duration.minutes(5),

        reservedConcurrentExecutions: 0,

        vpc,

        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },

        securityGroups: [lambdaSecurityGroup],

        logGroup: migrationLogGroup,

        environment: {
          NODE_ENV: "production",

          DATABASE_URL: databaseUrl,

          DEV_SEED_ENABLED: "false",
        },
      },
    );

    const apiIntegration = new integrations.HttpLambdaIntegration(
      "WarehouseApiIntegration",
      apiFunction,
      {
        payloadFormatVersion: apigwv2.PayloadFormatVersion.VERSION_2_0,

        scopePermissionToRoute: false,

        timeout: Duration.seconds(28),
      },
    );

    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "warehouse-production-api",

      createDefaultStage: false,

      defaultIntegration: apiIntegration,
    });

    const apiGatewayLogGroup = new logs.LogGroup(this, "ApiGatewayLogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,

      removalPolicy: RemovalPolicy.RETAIN,
    });

    new apigwv2.HttpStage(this, "DefaultStage", {
      httpApi,

      stageName: "$default",

      autoDeploy: true,

      detailedMetricsEnabled: true,

      throttle: {
        rateLimit: 20,

        burstLimit: 40,
      },

      accessLogSettings: {
        destination: new apigwv2.LogGroupLogDestination(apiGatewayLogGroup),

        format: apigw.AccessLogFormat.custom(
          JSON.stringify({
            requestId: "$context.requestId",

            requestTime: "$context.requestTime",

            httpMethod: "$context.httpMethod",

            routeKey: "$context.routeKey",

            status: "$context.status",

            responseLength: "$context.responseLength",

            integrationErrorMessage: "$context.integrationErrorMessage",
          }),
        ),
      },
    });

    const githubDeployRole = new iam.Role(this, "GithubProductionDeployRole", {
      roleName: "WarehouseGithubProductionDeployRole",

      description:
        "GitHub Actions OIDC deployment role for Warehouse production",

      assumedBy: new iam.WebIdentityPrincipal(
        `arn:aws:iam::${Aws.ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com`,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:viktor-siropol/warehouse-saas:environment:production",
          },
        },
      ),

      maxSessionDuration: Duration.hours(1),
    });

    const bootstrapRoleArn = Arn.format(
      {
        service: "iam",

        region: "",

        account: Aws.ACCOUNT_ID,

        resource: "role",

        resourceName: `cdk-hnb659fds-*-${Aws.ACCOUNT_ID}-${Aws.REGION}`,
      },
      this,
    );

    githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],

        resources: [bootstrapRoleArn],
      }),
    );

    const bootstrapVersionParameterArn = Arn.format(
      {
        service: "ssm",

        account: Aws.ACCOUNT_ID,

        region: Aws.REGION,

        resource: "parameter",

        resourceName: "cdk-bootstrap/hnb659fds/version",
      },
      this,
    );

    githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],

        resources: [bootstrapVersionParameterArn],
      }),
    );

    migrationFunction.grantInvoke(githubDeployRole);

    new CfnOutput(this, "ApiUrl", {
      value: httpApi.apiEndpoint,
    });

    new CfnOutput(this, "MigrationFunctionName", {
      value: migrationFunction.functionName,
    });

    new CfnOutput(this, "GithubDeployRoleArn", {
      value: githubDeployRole.roleArn,
    });

    new CfnOutput(this, "AwsRegion", {
      value: this.region,
    });
  }
}
