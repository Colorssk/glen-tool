const SimpleGit = require('simple-git');
const userHome = require('user-home');
const log = require('@glen-tool/cli/lib/utils/log');
const { dataTool } = require('@glen-tool/tool');
const fse = require('fs-extra');
const fs = require('fs');
const Gitlab = require('./gitlab');
const path = require('path');
// const
const GIT_TOKEN_FILE = '.git_token';// authentication file
const DEFAULT_GIT_HOME = './@glen-tool-git' // for store git information
const GIT_SERVER_FILE = './git_server_platform' // confirm witch platform you choose
const GITLAB = 'gitlab';
const GIT_SERVER_TYPE = [ {
    name: 'gitlab',
    value: GITLAB,
}];
const gitInstance = {
    [GITLAB]: new Gitlab()
}
class Git{
    constructor({refreshToken}){
        console.log('here---',refreshToken)
        this.git = SimpleGit(process.cwd());
        this.homePath = null;
        this.gitServer = null;
        this.refreshToken = refreshToken; // 强制刷新token
    }
    prepare = async () => {
        this.checkHomePath();
        await this.checkGitServer();
        await this.checkGitToken();
        console.log('prepare await ')
        await this.checkUserAndOrgs();
        // await this.checkGitOwner();
        // await this.checkRepo();
        // await this.checkGitIgnore();
        // await this.checkComponent();
        // await this.init();
    };

    // check dir for cache
    checkHomePath = () => {
        if (!this.homePath) {
            this.homePath = path.resolve(userHome, DEFAULT_GIT_HOME);
        }
        log.verbose('git home', this.homePath);
        fse.ensureDirSync(this.homePath);
        if (!fs.existsSync(this.homePath)) {
          throw new Error('get user home path failed！');
        }
    };

    createPath = (file) => {
        console.log('打印下home path地址', this.homePath)
        const filePath = path.resolve(this.homePath, file);
        fse.ensureFileSync(filePath);
        return filePath;
    };

    checkGitServer = async () => {
        const gitServerPath = this.createPath(GIT_SERVER_FILE);
        console.log('gitServerPath', gitServerPath)
        let gitServer = dataTool.readFile(gitServerPath);
        if (!gitServer || this.refreshServer) {
          gitServer = await dataTool.inquirer({
            type: 'list',
            choices: GIT_SERVER_TYPE,
            message: 'choose your git platform',
          });
          dataTool.writeFile(gitServerPath, gitServer);
          log.success('git server write in successfully', `${gitServer} -> ${gitServerPath}`);
        } else {
          log.success('get your platform ', gitServer);
        }
        this.gitServer = this.createGitServer(gitServer);
    };

    // 检查 git API 必须的 token  未完待续
    checkGitToken = async () => {
        const tokenPath = this.createPath(GIT_TOKEN_FILE);
        let token = dataTool.readFile(tokenPath);
        if (!token || this.refreshToken) {
        log.notice(this.gitServer.type + ' token not exist', 'please generate ' + this.gitServer.type + ' token，' + dataTool.terminalLink('guidance link', this.gitServer.getTokenHelpUrl()));
        token = await dataTool.inquirer({
            type: 'password',
            message: 'please paste your token there',
            defaultValue: '',
        });
        dataTool.writeFile(tokenPath, token);
        log.success('token write in successfullly', `${token} -> ${tokenPath}`);
        } else {
        log.verbose('token', token);
        log.success('get local token successfully', tokenPath);
        }
        this.token = token;
        this.gitServer.setToken(token);
    };

    createGitServer(gitServer) {
        return gitInstance[gitServer] || null;
    }

    checkUserAndOrgs(){
        // user get or write in
        
    }
}

module.exports = Git;