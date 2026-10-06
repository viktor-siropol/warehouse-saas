import { App } from "aws-cdk-lib";

import { WarehouseProductionStack } from "./warehouse-production-stack.js";

const app = new App();

const registrationContext = app.node.tryGetContext("publicRegistrationEnabled");

const publicRegistrationEnabled =
  registrationContext === true || registrationContext === "true";

new WarehouseProductionStack(app, "WarehouseProductionStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT ?? "000000000000",

    region: process.env.CDK_DEFAULT_REGION ?? "eu-central-1",
  },

  publicRegistrationEnabled,
});
