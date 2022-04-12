'use strict';
const Command = require('../command');
const execSync = require('child_process').execSync;
const { dataTool } = require('@glen-tool/tool');
const path = require('path');
const { execAsync } = require('@glen-tool/cli/lib/utils/util');
const log = require('@glen-tool/cli/lib/utils/log');
const fse = require('fs-extra');
const fs = require('fs');
const readline = require('readline');
const { resolve } = require('path');
const ejs = require('ejs');
const editFile = [
    'commit-msg'
]
const rulesTag = [
    '# rules',
    '# message'
];
const cmdList = ['npm', 'yarn']
class ProxyCommand extends Command {
    constructor(props) {
        super(props);
        this.scriptFileName = process.env.TARGETPATH || '';
        this.mainfestFilePath = path.resolve(process.cwd(), `./${process.env.TARGETPATH}`)
        this.tag = null;
        this.jekins = this._argv[0].jekins || false
        this.webpackPath = process.env.WEBPACKPATH || ''
        this.proxyUrl = null
        this.jsonRes = {
            rules: [],
            message: []
        };
    }
    async exec() {
        await this.check()
        if (this.jekins) {
            // 默认git已经初始化成功
            await this.gererateJekins();
        }
        const run_script = process.env.SCRIPT ? process.env.SCRIPT : 'npm run start'
        console.log('then execute', run_script)
        // 我执行了
        const [cmd, args] = this.checkCommand(run_script)
        const res = await execAsync(cmd, args, {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
        if (res !== 0) {
            throw new Error('run failed', res);
        }
    }
    checkCommand(cmd) {
        if (cmdList.includes(cmd.split(' ')[0])) {
            return [cmd.split(' ')[0], cmd.split(' ').slice(1)]
        } else {
            return [cmd, []]
        }
    }
    getProxyUrl(obj) {
        const res = []
        for (const [key, value] of Object.entries(obj)) {
            if (value && value.target && !value.ws) {
                if (!res.length) {
                    res.push(value.target)
                } else {
                    if (res[0] !== value.target) {
                        res.push(value.target)
                    }
                }

            }
        }
        // 此功能不强大，默认只获取第一个，所以要配置的环境，设定在开头即可
        return res.length > 0 && res[0]
    }
    async gererateJekins() {
        const context = {
            branch: '',
            projectName: '',
            host: '',
            credentialsId: '',
        }
        const pkgFile = require(path.resolve(process.cwd(), 'package.json'));
        const name = pkgFile.name;
        const credentialsId = pkgFile.credentialsId
        context.credentialsId = credentialsId
        context.projectName = name;
        if (!name || !credentialsId) {
            throw new Error('in package.json please set name. it will use to as directory in remote server to store front-end package files');
        }
        const version = execSync('git branch -v').toString().trim().split(' ')[1];
        context.branch = version;
        const rootPath = path.normalize(path.resolve(process.cwd(), this.webpackPath));
        log.notice('start to read webpack file...');
        try {
            const code = require(`${rootPath}`);
            if (code) {
                const { devServer = null } = code
                if (typeof (devServer) !== 'object' && typeof (code) !== 'object') {
                    throw new Error('illegal webpackpath require proxy is [object]')
                }
                let analyzeData = (devServer && typeof (devServer) === 'object') ? devServer : code
                let proxyUrl = this.getProxyUrl(analyzeData)
                proxyUrl = proxyUrl.substring(proxyUrl.indexOf('//') + 2, proxyUrl.lastIndexOf(':'))
                if (proxyUrl) {
                    this.proxyUrl = proxyUrl
                }
                console.log(this.proxyUrl)

            } else {
                throw new Error('require webpack code failed')
            }
        } catch (e) {
            throw new Error('require webpack code failed', e)
        }
        context.host = this.proxyUrl
        console.log(context)
        const res = await this.ejsRender(context, { targetPathFileName: 'Jenkinsfile', localDefaultPathFileName: 'Jenkinsfile-template' }, false)
        if (res) {
            log.success('automatically gererate jekinsfile success');
        }
    }
    // check hook exist
    async check() {
        // step 1
        try {
            const hookDir = fs.existsSync(path.resolve(process.cwd(), './.git/hooks'))
            if (!hookDir) {
                fs.mkdirSync(path.resolve(process.cwd(), './.git/hooks'))
                log.success('create hooks directory successfully')
            }
        } catch (e) {
            throw new Error('create hook dir failed, please create manually')
        }
        // git check or initialize---inclue: jekinsfile edit automatically（need current branch）, check nodemodules can not commit modify react or some other modules
        // step 2
        if (this.scriptFileName && fs.existsSync(this.mainfestFilePath)) {
            await this.readCustomizedRules()
            if (this.jsonRes.rules.length) {
                try {
                    const { rules = [], message = [] } = this.jsonRes;
                    let resRules = '';
                    if (Array.isArray(rules) && rules.length) {
                        rules.forEach((el, index) => {
                            resRules += String(el)
                            if (index !== rules.length - 1) {
                                resRules += '|'
                            }
                        })
                    }
                    const res = await this.ejsRender({ rules: resRules, message: message.join('\r\n') }, { targetPathFileName: 'commit-msg', localDefaultPathFileName: 'commitMsg-template' })
                    if (res) {
                        log.success('customized rules gererate success');
                    }
                } catch (e) {
                    throw new Error('json parse error', e)
                }
            } else {
                this.isFileExist(editFile)
            }

        } else {
            // use default(local rule) generate commit msg
            //  check  the file in the .git  whether exist
            this.isFileExist(editFile)
        }
        log.success('check file path success');
    }
    async ejsRender(context, fileName, isGit = true) {
        return new Promise((resolve, reject) => {
            const targetPath = this.generatePath(fileName.targetPathFileName, isGit)
            const originPath = this.getLocalDefaultScript(fileName.localDefaultPathFileName);
            const originRes = fse.readFileSync(originPath);
            fse.writeFileSync(targetPath, originRes)
            try {
                // modify target file directly
                ejs.renderFile(targetPath, context, (err, result) => {
                    if (err) {
                        console.log('issue:', err)
                        reject(err);
                    } else {
                        fse.writeFileSync(targetPath, result);
                        resolve(result);
                    }
                });
            } catch (e) {
                throw new Error(e)
            }

        });
    }
    // readCustomizedRules
    async readCustomizedRules() {
        const rl = readline.createInterface({
            input: fs.createReadStream(this.mainfestFilePath)
        });
        for await (const line of rl) {
            const data = String(line).trim();
            if (data === '# rules') {
                this.tag = 'rules';
            }
            if (data === '# message') {
                this.tag = 'message';
            }
            if (!rulesTag.includes(data)) {
                const exgString = data.split(' ').join('')
                if (this.tag && data.split(' ').join('').length) {
                    this.jsonRes[this.tag].push(exgString);
                    console.log(this.jsonRes[this.tag])
                }
            }
        }
    }
    isJSON(str) {
        if (typeof str == 'string') {
            try {
                JSON.parse(str);
                return true;
            } catch (e) {
                return false;
            }
        }
    }
    // in hook
    isFileExist(dir) {
        try {
            if (Array.isArray(dir) && dir.length) {
                dir.forEach(e => {
                    const data = fse.readFileSync(this.getLocalDefaultScript(e));
                    fse.writeFileSync(this.generatePath(e), data)

                })
            } else {
                const data = fse.readFileSync(this.getLocalDefaultScript(dir));
                fse.writeFileSync(this.generatePath(dir), data)
            }
        } catch (e) {
            throw e
        }

    }
    generatePath(file, isGit = true) {
        return path.resolve(process.cwd(), isGit ? `./.git/hooks/${file}` : file)
    }
    getLocalDefaultScript(file) {
        return path.resolve(__dirname, `./scripts/${file}`);
    }

}

function proxyRun() {
    const args = dataTool.serialize(...arguments);
    return new ProxyCommand(args);
}
module.exports = proxyRun