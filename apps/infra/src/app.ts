import { App } from "aws-cdk-lib";

import { WarehouseProductionStack } from "./warehouse-production-stack.js";

const app = new App();

function readBooleanContext(name: string, defaultValue: boolean): boolean {
  const value = app.node.tryGetContext(name);

  if (value === undefined) {
    return defaultValue;
  }

  return value === true || value === "true";
}

const account = process.env.CDK_DEFAULT_ACCOUNT;

if (!account) {
  throw new Error(
    "CDK_DEFAULT_ACCOUNT is not available. Authenticate to AWS before running CDK.",
  );
}

const region = process.env.CDK_DEFAULT_REGION ?? "eu-central-1";

new WarehouseProductionStack(app, "WarehouseProductionStack", {
  env: {
    account,
    region,
  },

  publicRegistrationEnabled: readBooleanContext(
    "publicRegistrationEnabled",
    false,
  ),

  databaseDeletionProtection: readBooleanContext(
    "databaseDeletionProtection",
    true,
  ),
});
