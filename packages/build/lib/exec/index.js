'use strict';
module.exports = execute
const exec = require('../../../cli/lib/exec');
const Command = require('../command');
const inquirer = require('inquirer');
// const {  defaultScriptObj } = require('./defaultConfig');

class Exec extends Command{
    async exec(){
        let ifContinue = false
        if(this._cmd.check){
            ifContinue = (await inquirer.prompt({
                type: 'confirm',
                name: 'ifContinue',
                default: false,
                message: 'confirm to check the modules?',
            })).ifContinue;
            if(ifContinue){
                // check the modules
                //  ------
                console.log('check the module')
            }
        }
        
        console.log('then')
    }
}

function execute(){
    const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null);
      Object.keys(cmd).forEach(key => {
        if (cmd.hasOwnProperty(key) &&
          !key.startsWith('_') &&
          key !== 'parent') {
          o[key] = cmd[key];
        }
      });
    args[args.length - 1] = o;
    return new Exec(args);
}