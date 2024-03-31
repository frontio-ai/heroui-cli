import type { SAFE_ANY } from './type';

import { readFileSync } from 'fs';

import {
  FRAMER_MOTION,
  NEXT_UI,
  SYSTEM_UI,
  TAILWINDCSS,
  THEME_UI,
  appRequired,
  tailwindRequired
} from 'src/constants/required';

import { getMatchArray, getMatchImport } from './match';

export type CheckType = 'all' | 'partial';

type CheckResult<T extends SAFE_ANY[] = SAFE_ANY[]> = [boolean, ...T];
/**
 * Check if the required content is installed
 * @example return result and missing required [false, '@nextui-org/react', 'framer-motion']
 * @param type
 * @param dependenciesKeys
 * @returns
 */
export function checkRequiredContentInstalled(
  type: CheckType,
  dependenciesKeys: Set<string>
): CheckResult {
  const result = [] as unknown as CheckResult;

  if (type === 'all') {
    const hasAllComponents = dependenciesKeys.has(NEXT_UI);
    const hasFramerMotion = dependenciesKeys.has(FRAMER_MOTION);
    const hasTailwind = dependenciesKeys.has(TAILWINDCSS);

    if (hasAllComponents && hasFramerMotion) {
      return [true];
    }
    !hasAllComponents && result.push(NEXT_UI);
    !hasFramerMotion && result.push(FRAMER_MOTION);
    !hasTailwind && result.push(TAILWINDCSS);
  } else if (type === 'partial') {
    const hasFramerMotion = dependenciesKeys.has(FRAMER_MOTION);
    const hasTailwind = dependenciesKeys.has(TAILWINDCSS);
    const hasSystemUI = dependenciesKeys.has(SYSTEM_UI);
    const hasThemeUI = dependenciesKeys.has(THEME_UI);

    if (hasFramerMotion && hasSystemUI && hasThemeUI) {
      return [true];
    }
    !hasFramerMotion && result.push(FRAMER_MOTION);
    !hasSystemUI && result.push(SYSTEM_UI);
    !hasThemeUI && result.push(THEME_UI);
    !hasTailwind && result.push(TAILWINDCSS);
  }

  return [false, ...result];
}

export function checkTailwind(type: CheckType, tailwindPath: string): CheckResult {
  const result = [] as unknown as CheckResult;

  if (type === 'all') {
    const tailwindContent = readFileSync(tailwindPath, 'utf-8');

    const contentMatch = getMatchArray('content', tailwindContent);
    const pluginsMatch = getMatchArray('plugins', tailwindContent);

    // Check if the required content is added Detail: https://nextui.org/docs/guide/installation#global-installation
    const isDarkModeCorrect = new RegExp(tailwindRequired.darkMode).test(tailwindContent);
    const isContentCorrect = contentMatch.some((content) =>
      content.includes(tailwindRequired.content)
    );
    const isPluginsCorrect = pluginsMatch.some((plugins) =>
      plugins.includes(tailwindRequired.plugins)
    );

    if (isDarkModeCorrect && isContentCorrect && isPluginsCorrect) {
      return [true];
    }

    !isDarkModeCorrect && result.push(tailwindRequired.darkMode);
    !isContentCorrect && result.push(tailwindRequired.content);
    !isPluginsCorrect && result.push(tailwindRequired.plugins);
  }

  return [false, ...result];
}

export function checkApp(type: CheckType, appPath: string): CheckResult {
  const result = [] as unknown as CheckResult;

  if (type === 'all') {
    const appContent = readFileSync(appPath, 'utf-8');

    const importArray = getMatchImport(appContent);
    const isAppCorrect = importArray.some(([key]) => key!.includes(appRequired.import));

    if (isAppCorrect) {
      return [true];
    }

    !isAppCorrect && result.push(appRequired.import);
  }

  return [false, ...result];
}
