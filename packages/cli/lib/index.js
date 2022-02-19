'use strict';

module.exports = core;
const path = require('path');
const semver = require('semver')
const colors = require('colors/safe');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const log = require('../utils/log')
const pkg = require('../package.json');
const constant = require('./const');
const commander = require('commander');
const exec = require('../exec');

const program = new commander.Command();
async function  core() {
    try {
        await prepare();
        registerCommand();
      } catch (e) {
        log.error(e.message);
        if (program.debug) {
          console.log(e);
        }
      }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec);

  // 开启debug模式
  program.on('option:debug', function() {
    if (program.debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
  });

  // 指定targetPath
  program.on('option:targetPath', function() {
    process.env.CLI_TARGET_PATH = program.targetPath;
  });

  // 对未知命令监听
  program.on('command:*', function(obj) {
    const availableCommands = program.commands.map(cmd => cmd.name());
    console.log(colors.red('unavailable command：' + obj[0]));
    if (availableCommands.length > 0) {
      console.log(colors.red('valid commands：' + availableCommands.join(',')));
    }
  });

  program.parse(process.argv);

  if (program.args && program.args.length < 1) {
    program.outputHelp();
  }
}

async function prepare() {
    checkPkgVersion();
    log.success('cli version check success');
    checkRoot();
    log.success('root check success');
    checkUserHome();
    log.success('useHome exist');
    checkEnv();
    log.success('.env set success');
    await checkGlobalUpdate();
    log.success('have check cli version normal')
  }
  function checkPkgVersion() {
    log.info('cli', pkg.version);
  }
  function checkEnv() {
    const dotenv = require('dotenv');
    const dotenvPath = path.resolve(userHome, '.env');
    if (pathExists(dotenvPath)) {
      dotenv.config({
        path: dotenvPath,
      });
    }
    createDefaultConfig();
}
async function checkGlobalUpdate() {
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    const { getNpmSemverVersion } = require('../utils/get-npm-info');
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
      log.warn(colors.yellow(`please manual update ${npmName}，current version：${currentVersion}，latest version：${lastVersion}
                  update command： npm install -g ${npmName}`));
    }
}
// cli-releative-config global
function createDefaultConfig() {
    const cliConfig = {
      home: userHome,
    };
    if (process.env.CLI_HOME) {
      cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
    } else {
      cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function checkRoot() {
    const rootCheck = require('root-check');
    rootCheck();
}

// for sure next step of cache or operations of directory
function checkUserHome() {
    if (!userHome || !pathExists(userHome)) {
      throw new Error(colors.red('current login user-directory is not exist！'));
    }
}
