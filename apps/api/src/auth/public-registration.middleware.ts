import type { NextFunction, Request, Response } from 'express';

export function publicRegistrationMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const production = process.env.NODE_ENV === 'production';

  const enabled = process.env.PUBLIC_REGISTRATION_ENABLED === 'true';

  if (request.method === 'POST' && production && !enabled) {
    response.status(403).json({
      statusCode: 403,

      message: 'Public registration is disabled',
    });

    return;
  }

  next();
}
