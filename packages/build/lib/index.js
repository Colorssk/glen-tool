'use strict';
module.exports = build;
const commander = require('commander');
const colors = require('colors/safe');
const program = new commander.Command();
const pkg = require('../package.json');
const execute = require('./exec');
const ciGenerate = require('./CI');
const proxyRun = require('./proxyRun');
const gitExecute = require('./gitAction');


async function build(){
    try {
        await registerCommand()
    } catch {
        console.log(error)
    }
}

async function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', 'whether open debug', false)
        .option('-e, --entry', 'select you entry file', '')
        .option('-s, --script <script>', 'set your run script')
        .option('-tp, --targetPath <targetPath>', 'set your rule path to verify msg', '')
        .option('-wp, --webpackPath <webpackPath>', 'set your webpackPath path', '')

    // 代理启动项目
    program
        .command('run')
        .option('-jk, --jekins', 'gererate jekinsFile', false)
        .action(proxyRun)

    program
        .command('git')
        .option('-rft, --refreshToken', 'force to resfresh token', false)
        .action(gitExecute)

    program
        .command('execute [script]')
        .option('-c, --check', 'check your modules and check pkg.json setting', false)
        .action(execute);

    // configure jenkins for projects
    program
        .command('ci')
        .option('-f, --force', 'force to cover original jenkinsFile', false)
        .action(ciGenerate);

    // 对未知命令监听
    program.on('command:*', function (obj) {
        const availableCommands = program.commands.map(cmd => cmd.name());
        console.log(colors.red('unavailable command：' + obj[0]));
        if (availableCommands.length > 0) {
            console.log(colors.red('valid commands：' + availableCommands.join(',')));
        }
    });

    // set read entry file dir
    program.on('option:entry', function(){
        process.env.ENTRY_PATH = program.entry;
    })

    program.on('option:script', function(){
        process.env.SCRIPT = program.script ? program.script.replace('/', ' ') : '';
    })

    program.on('option:targetPath', function(){
        process.env.TARGETPATH = program.targetPath;
    })

    program.on('option:webpackPath', function(){
        process.env.WEBPACKPATH = program.webpackPath;
    })
    program.parse(process.argv)
}
