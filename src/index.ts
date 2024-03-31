import chalk from 'chalk';
import {Command} from 'commander';

import {Logger} from '@helpers/logger';
import {getCommandDescAndLog} from '@helpers/utils';

import pkg from '../package.json';

import {envAction} from './actions/env-action';
import {initAction} from './actions/init-action';
import {listAction} from './actions/list-action';

const nextui = new Command();

nextui
  .name('nextui')
  .usage('[command]')
  .description(
    `${chalk.blue(getCommandDescAndLog(`\nNextUI CLI ${pkg.version}\n\n${pkg.description}\n`, ''))}`
  )
  .version(pkg.version, '-v, --version', 'Output the current version')
  .helpOption('-h, --help', 'Display help for command')
  .allowUnknownOption();

nextui
  .command('init')
  .description('Initialize a new NextUI project')
  .argument('[projectName]', 'The name of the new project')
  .option('-t --template [string]', 'The template to use for the new project e.g. app, pages')
  /** ======================== TODO:(winches)Temporary use npm with default value ======================== */
  // .option('-p --package [string]', 'The package manager to use for the new project')
  .action(initAction);

nextui
  .command('list')
  .description('List all the components status, description, version, etc')
  .option('-p --packagePath [string]', 'The path to the package.json file')
  .option('-c --current', 'List the current installed components')
  .action(listAction);

nextui
  .command('env')
  .description('Display debug information about the local environment')
  .option('-p --packagePath [string]', 'The path to the package.json file')
  .action(envAction);

nextui.parseAsync(process.argv).catch(async (reason) => {
  Logger.newLine();
  Logger.error('Unexpected error. Please report it as a bug:');
  Logger.log(reason);
  Logger.newLine();
  process.exit(1);
});
