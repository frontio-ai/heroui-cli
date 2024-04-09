import {readFileSync} from 'fs';

import {
  type NextUIComponents,
  nextUIComponents,
  nextUIComponentsMap
} from 'src/constants/component';
import {NEXT_UI} from 'src/constants/required';

import {Logger} from './logger';
import {getVersionAndMode} from './utils';

/**
 * Get the package information
 * @param packagePath string
 * @param transformVersion boolean
 */
export function getPackageInfo(packagePath: string, transformVersion = true) {
  let pkg;

  try {
    pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  } catch (error) {
    Logger.prefix('error', `Error reading package.json file: ${packagePath} \nError: ${error}`);
  }

  const devDependencies = pkg.devDependencies || {};
  const dependencies = pkg.dependencies || {};
  const allDependencies = {...devDependencies, ...dependencies};
  const allDependenciesKeys = new Set(Object.keys(allDependencies));

  const currentComponents = (nextUIComponents as unknown as NextUIComponents).filter(
    (component) => {
      if (allDependenciesKeys.has(component.package)) {
        const {currentVersion, versionMode} = getVersionAndMode(allDependencies, component.package);

        component.version = transformVersion
          ? `${currentVersion} new: ${component.version}`
          : currentVersion;
        component.versionMode = versionMode;

        return true;
      }

      return false;
    }
  ) as NextUIComponents;
  const isAllComponents = allDependenciesKeys.has(NEXT_UI);

  return {
    allDependencies,
    allDependenciesKeys,
    currentComponents,
    dependencies,
    devDependencies,
    isAllComponents,
    package: pkg
  };
}

export function transformComponentsToPackage(components: string[]) {
  return components.map((component) => {
    const nextuiComponent = nextUIComponentsMap[component];
    const packageName = nextuiComponent?.package;

    return packageName ? packageName : component;
  });
}
