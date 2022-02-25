'use strict';
module.exports = build;
const commander = require('commander');
const colors = require('colors/safe');
const program = new commander.Command();
const pkg = require('../package.json');

function build() {
    try {
        registerCommand()
    } catch {
        console.log(error)
    }
}

function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', 'whether open debug', false)
        .option('-e, --entry', 'select you entry file', '')

    program
        .command('execute [script]')
        .option('-c, --check', 'check your modules and check pkg.json setting', false)
        .action(exec);

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
    program.parse(process.argv)
}
