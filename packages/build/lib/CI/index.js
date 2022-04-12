'use strict';
const Command = require('../command');
const { dataTool } = require('@glen-tool/tool');
class CI extends Command {
    async exec() {
        // jekins脚本加载， 放到cli流程中完成， build中就不处理 
    }
}

function ciGenerate() {
    const args = dataTool.serialize(...arguments);
    console.log(args, '1---')
    return new CI(args);
}
module.exports = ciGenerate
