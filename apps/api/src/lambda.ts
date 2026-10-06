import type { Handler } from "aws-lambda";

import {
  configure as serverlessExpress,
} from "@codegenie/serverless-express";

import { createWarehouseApplication } from "./bootstrap.js";

let cachedHandler: Handler | null = null;

async function getHandler(): Promise<Handler> {
  if (cachedHandler) {
    return cachedHandler;
  }

  const { app } = await createWarehouseApplication();

  await app.init();

  cachedHandler = serverlessExpress({
    app: app.getHttpAdapter().getInstance(),
  }) as Handler;

  return cachedHandler;
}

export const handler: Handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const lambdaHandler = await getHandler();

  return lambdaHandler(event, context, callback);
};
