'use strict';
const Command = require('../command');
const { dataTool } = require('@glen-tool/tool');
const Git = require('../Git/git');
class GitAction extends Command {
    constructor(props) {
        super(props);
        this.git = new Git(props[0]);
    }
    async exec(){
        this.git.prepare();
    }
    
}

function gitExecute() {
    const args = dataTool.serialize(...arguments);
    return new GitAction(args);
}
module.exports = gitExecute