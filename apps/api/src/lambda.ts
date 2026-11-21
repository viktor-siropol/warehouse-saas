import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import { configure as serverlessExpress } from '@codegenie/serverless-express';

import { createWarehouseApplication } from './bootstrap.js';

type ServerlessExpressHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<unknown>;

let cachedHandler: ServerlessExpressHandler | null = null;

async function getHandler(): Promise<ServerlessExpressHandler> {
  if (cachedHandler) {
    return cachedHandler;
  }

  const { app } = await createWarehouseApplication();

  await app.init();

  cachedHandler = serverlessExpress({
    app: app.getHttpAdapter().getInstance(),
  }) as unknown as ServerlessExpressHandler;

  return cachedHandler;
}

export async function handler(
  event: APIGatewayProxyEventV2,

  context: Context,
): Promise<unknown> {
  context.callbackWaitsForEmptyEventLoop = false;

  const lambdaHandler = await getHandler();

  return lambdaHandler(event, context);
}
