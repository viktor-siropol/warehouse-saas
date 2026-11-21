import { existsSync, readFileSync } from 'node:fs';

import { spawnSync } from 'node:child_process';

import path from 'node:path';

function findPrismaCli(apiDirectory, taskRoot) {
  const candidates = [
    path.join(apiDirectory, 'node_modules', 'prisma', 'package.json'),

    path.join(taskRoot, 'node_modules', 'prisma', 'package.json'),
  ];

  for (const packageJsonPath of candidates) {
    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    const bin =
      typeof packageJson.bin === 'string'
        ? packageJson.bin
        : packageJson.bin?.prisma;

    if (!bin) {
      continue;
    }

    const cliPath = path.resolve(path.dirname(packageJsonPath), bin);

    if (existsSync(cliPath)) {
      return cliPath;
    }
  }

  throw new Error(
    [
      'Prisma CLI executable was not found.',
      `Checked: ${candidates.join(', ')}`,
    ].join(' '),
  );
}

export async function handler() {
  const taskRoot = process.env.LAMBDA_TASK_ROOT ?? '/var/task';

  const apiDirectory = path.join(taskRoot, 'apps', 'api');

  const prismaCli = findPrismaCli(apiDirectory, taskRoot);

  console.log(`Using Prisma CLI: ${prismaCli}`);

  console.log('Starting production Prisma migrations');

  const result = spawnSync(
    process.execPath,
    [prismaCli, 'migrate', 'deploy', '--config', 'prisma7.config.ts'],
    {
      cwd: apiDirectory,

      env: process.env,

      encoding: 'utf8',

      maxBuffer: 10 * 1024 * 1024,
    },
  );

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Prisma migrate deploy failed with exit code ${result.status}`,
    );
  }

  console.log('Production Prisma migrations completed');

  return {
    status: 'ok',
  };
}
