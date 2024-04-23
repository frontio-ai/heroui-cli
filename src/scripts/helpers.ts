import {exec} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';

import retry from 'async-retry';
import chalk from 'chalk';
import {oraPromise} from 'ora';

import {Logger} from '@helpers/logger';
import {COMPONENTS_PATH} from 'src/constants/path';
import {getStore} from 'src/constants/store';

export type Components = {
  name: string;
  package: string;
  version: string;
  docs: string;
  description: string;
  status: string;
  style: string;
}[];

export type ComponentsJson = {
  version: string;
  components: Components;
};

/**
 * Compare two versions
 * @example compareVersions('1.0.0', '1.0.1') // -1
 * compareVersions('1.0.1', '1.0.0') // 1
 * compareVersions('1.0.0', '1.0.0') // 0
 * @param version1
 * @param version2
 */
export function compareVersions(version1: string, version2: string) {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);

  for (let i = 0; i < parts1.length; i++) {
    if (parts1[i] !== undefined && parts2[i] !== undefined) {
      if (parts1[i]! > parts2[i]!) {
        return 1;
      } else if (parts1[i]! < parts2[i]!) {
        return -1;
      }
    }
  }

  return 0;
}

export async function updateComponents() {
  if (!existsSync(COMPONENTS_PATH)) {
    // First time download the latest date from net
    await autoUpdateComponents();

    return;
  }

  const components = JSON.parse(readFileSync(COMPONENTS_PATH, 'utf-8')) as ComponentsJson;
  const currentVersion = components.version;
  const latestVersion = await getStore('latestVersion');

  if (compareVersions(currentVersion, latestVersion) === -1) {
    // After the first time, check the version and update
    await autoUpdateComponents(latestVersion);

    return;
  }
}

export async function getComponents() {
  let components: ComponentsJson = {} as ComponentsJson;

  await updateComponents();

  try {
    components = JSON.parse(readFileSync(COMPONENTS_PATH, 'utf-8')) as ComponentsJson;
  } catch (error) {
    new Error(`Get components.json error: ${error}`);
  }

  return components;
}

export async function getLatestVersion(packageName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`npm view ${packageName} version`, (error, stdout) => {
      if (error) {
        Logger.error(`Get latest ${packageName} error: ${error}`);
        reject(error);
      }
      resolve(stdout.trim());
    });
  });
}

const getUnpkgUrl = (version: string) =>
  `https://unpkg.com/@nextui-org/react@${version}/dist/components.json`;

export async function autoUpdateComponents(latestVersion?: string) {
  latestVersion = latestVersion || ((await getStore('latestVersion')) as string);
  const url = getUnpkgUrl(latestVersion);

  const components = await downloadFile(url);

  const componentsJson = {
    components,
    version: latestVersion
  };

  writeFileSync(COMPONENTS_PATH, JSON.stringify(componentsJson, null, 2), 'utf-8');
}

export async function downloadFile(url: string): Promise<Components> {
  let data;

  await oraPromise(
    retry(
      async (bail) => {
        try {
          const result = await fetch(url, {
            body: null,
            headers: {
              'Content-Type': 'application/json',
              accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
            },
            method: 'GET',
            mode: 'cors'
          });

          data = JSON.parse(await result.text());
        } catch (error) {
          bail(error);
        }
      },
      {
        retries: 3
      }
    ),
    {
      failText(error) {
        Logger.prefix('error', `Update components data error: ${error}`);
        process.exit(1);
      },
      successText: (() => {
        return chalk.greenBright('Components data update successfully!\n');
      })(),
      text: 'Fetching components data...'
    }
  );

  return data;
}
