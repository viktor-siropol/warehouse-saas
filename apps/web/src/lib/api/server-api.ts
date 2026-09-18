import 'server-only';

import {
  getAccessToken,
} from '@/lib/auth/session';

export class ApiError
  extends Error
{
  constructor(
    public readonly status:
      number,

    message: string,
  ) {
    super(message);

    this.name =
      'ApiError';
  }
}

function getApiUrl():
  string {
  const apiUrl =
    process.env.API_URL;

  if (!apiUrl) {
    throw new Error(
      'API_URL is not configured',
    );
  }

  return apiUrl.replace(
    /\/+$/,
    '',
  );
}

async function parseErrorMessage(
  response: Response,
): Promise<string> {
  const body:
    unknown =
    await response
      .json()
      .catch(
        () => null,
      );

  if (
    typeof body ===
      'object' &&
    body !== null &&
    'message' in body
  ) {
    const message =
      body.message;

    if (
      Array.isArray(
        message,
      )
    ) {
      return message
        .filter(
          (
            item,
          ): item is string =>
            typeof item ===
            'string',
        )
        .join(', ');
    }

    if (
      typeof message ===
      'string'
    ) {
      return message;
    }
  }

  return `API request failed with status ${response.status}`;
}

async function executeRequest<T>(
  path: string,
  init: RequestInit,
  accessToken?: string,
): Promise<T> {
  const headers =
    new Headers(
      init.headers,
    );

  headers.set(
    'Accept',
    'application/json',
  );

  if (
    typeof init.body ===
      'string' &&
    !headers.has(
      'Content-Type',
    )
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );
  }

  if (accessToken) {
    headers.set(
      'Authorization',
      `Bearer ${accessToken}`,
    );
  }

  const response =
    await fetch(
      `${getApiUrl()}${path}`,
      {
        ...init,

        headers,

        cache:
          init.cache ??
          'no-store',
      },
    );

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await parseErrorMessage(
        response,
      ),
    );
  }

  if (
    response.status === 204
  ) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function publicApiFetch<T>(
  path: string,
  init:
    RequestInit = {},
): Promise<T> {
  return executeRequest<T>(
    path,
    init,
  );
}

export async function authenticatedApiFetch<T>(
  path: string,
  init:
    RequestInit = {},
): Promise<T> {
  const accessToken =
    await getAccessToken();

  if (!accessToken) {
    throw new ApiError(
      401,
      'Authentication required',
    );
  }

  return executeRequest<T>(
    path,
    init,
    accessToken,
  );
}