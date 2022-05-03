const SimpleGit = require('simple-git');
const userHome = require('user-home');
const log = require('@glen-tool/cli/lib/utils/log');
const { dataTool } = require('@glen-tool/tool');
const fse = require('fs-extra');
const fs = require('fs');
const Gitlab = require('./gitlab');
const path = require('path');
const pkgDir = require('pkg-dir').sync;
// const
const DEFAULT_GIT_HOME = './@glen-tool-git' // for store git information
const GIT_TOKEN_FILE = '.git_token';// authentication file
const GIT_SERVER_FILE = './git_server_platform' // confirm witch platform you choose
const GIT_IGNORE_FILE = '.gitignore';
const GITLAB = 'gitlab';
const GIT_ROOT_DIR = '.git';
const GIT_SERVER_TYPE = [{
    name: 'gitlab',
    value: GITLAB,
}];
const gitInstance = {
    [GITLAB]: new Gitlab()
}
class Git {
    constructor({ refreshToken, pull, merge }) {
        this.git = SimpleGit(process.cwd());
        this.homePath = null;
        this.gitServer = null;
        this.gitPlatform = null;
        this.userId = null;
        this.userName = null;
        this.projectName = null;
        this.web_url = null;// git owner web_url form user infomation
        this.refreshToken = refreshToken; // flag force to resfresh token
        this.pull = pull; // flag execute update current branch action
        this.repo = null; // with your projectName to get repo info
        this.originBranches = null; // current origin repo branches
        this.currentBranch = null; //  only execute updateBranch(specify --pull/-p) can assign
        this.upstreamBranches = null; // current upstream repo branches
        this.localBranches = null; // local all branches atribute all is list inclue all branches
        this.merge = merge; // start to merge request
    }
    prepare = async () => {
        this.checkHomePath();
        await this.checkGitServer();
        await this.checkGitToken();
        await this.checkUser();
        await this.checkRepo();
        // await this.checkGitIgnore(); // right now this will affect initial pull
        await this.init();
        console.log('prepare await')
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
        this.gitPlatform = gitServer;
        this.gitServer = this.createGitServer(gitServer);
    };

    // check git API token
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

    // check owner， default that you have account
    checkUser = async () => {
        const userIdInfo = await this.gitServer.getUserId(this.token)
        // notice: whether need to confirm active
        if (userIdInfo[0].user_id) {
            this.userId = userIdInfo[0].user_id
        } else {
            throw new Error(`when get userid, i can not fetch from ${this.gitPlatform}`)
        }
        log.notice(`userId->${this.userId}`)
        // get userName
        const userInfo = await this.gitServer.getUser(this.userId, this.token)
        if (userInfo.username) {
            this.username = userInfo.username
        } else {
            throw new Error(`when get username, i can not fetch from ${this.gitPlatform}`)
        }
        log.notice(`username->${this.username}`)
    }

    // check repo, default that repo have same repo(currently we dont help to create new repo)
    checkRepo = async () => {
        const dir = pkgDir(process.cwd());
        if (dir) {
            const pkgFile = require(path.resolve(dir, 'package.json'));
            if (pkgFile && pkgFile.name) {
                this.projectName = pkgFile.name;
            } else {
                throw new Error('pkg not exist or pkg.name not exist, please verify the pkg.name let it equal to project name')
            }
        } else {
            // support to spcify the repo name by youself
            this.projectName = await dataTool.inquirer({
                type: 'input',
                message: 'please write the repo name you want to hook up to',
                defaultValue: '',// if necessary add validate
            });
            if (this.projectName) {
                const confirm = await dataTool.inquirer({
                    type: 'confirm',
                    name: 'confirmProjectName',
                    default: true,
                    message: 'confirm your project name？',
                })
                if (!confirm) {
                    this.checkRepo()
                }
            } else {
                this.checkRepo()
            }
        }
        try {
            console.log(this.projectName)
            const repo = await this.gitServer.getRepo(this.projectName);
            if (!repo) {
                throw new Error(`${this.projectName} can not find  in ${this.gitPlatform} not access, let superior to creat one`)
            }
            log.success(`get repo info: remote web_url->${repo.web_url}`)
            if (repo.forked_from_project) {
                log.success(`get upstream repo info: fork from web_url->${repo.forked_from_project.web_url}`)
            } else {
                throw new Error('your projet is not clone from other project, you break the rule, so this [git] command is no suitable to you')
            }
            this.repo = repo;
            // console.log(repo)
        } catch (e) {
            log.error('if repo exist in current directory, please confirm that project name(in package.json) equal to repo name', e)
        }
    };

    // whatevere the project have git function,require check .gitignore
    checkGitIgnore = async () => {
        const gitIgnore = path.resolve(process.cwd(), GIT_IGNORE_FILE);
        if (!fs.existsSync(gitIgnore)) {
            dataTool.writeFile(gitIgnore, `.DS_Store
node_modules
/dist


# local env files
.local
.*.local

# Log files
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`);
            log.success('automatically write into .gitignore 文件');
        }
    };

    // init git
    init = async () => {
        if (await this.getRemote()) {
            log.notice('have initialized project')
            if (this.pull) {
                this.updateBranch()
            }
            if(this.merge){
                await this.getAllBranches();
                this.mergeRequest();
            }
            return true;
        }
        await this.initAndAddRemote();
        await this.initCommit();
        log.success(`repo: ${this.projectName} initialize successfully`);
    };

    getRemote = async () => {
        const gitPath = path.resolve(process.cwd(), GIT_ROOT_DIR);
        this.remote = this.repo.ssh_url_to_repo
        if (fs.existsSync(gitPath)) {
            log.success('(have .git directory)git init have succeed, will not init for you');
            return true;
        }
    };

    initAndAddRemote = async () => {
        log.notice('execute git initialize');
        await this.git.init(process.cwd());
        log.notice('add git remote');
        const remotes = await this.git.getRemotes();
        console.log('git remotes', remotes);
        if (!remotes.find(item => item.name === 'origin')) {
            await this.git.addRemote('origin', this.remote);
            await this.git.addRemote('upstream', this.repo.forked_from_project.ssh_url_to_repo);
        }
    };

    initCommit = async () => {
        // confirm currenct repo have no conflict
        await this.checkConflicted();
        // confirm currenct repo have no commit
        await this.checkNotCommitted();
        if (await this.checkRemoteMaster()) {
            log.notice('remote repo master branch exist, force to combine');
            await this.pullRemoteRepo('master');
        } else {
            log.error('have you fork your project correctly, please confirm that');
            process.exit(0)
        }
    };

    checkRemoteMaster = async () => {
        return (await this.git.listRemote(['--refs'])).indexOf('refs/heads/master') >= 0;
    };

    checkConflicted = async () => {
        log.notice('code conflict checking');
        const status = await this.git.status();
        if (status.conflicted.length > 0) {
            throw new Error('code conflict exist, please cope with then try again！');
        }
        log.success('code check passed');
    };

    checkNotCommitted = async (isAddByUser = true) => {
        const status = await this.git.status();
        if (status.not_added.length > 0 ||
            status.created.length > 0 ||
            status.deleted.length > 0 ||
            status.modified.length > 0 ||
            status.renamed.length > 0) {
            console.log('status', status)
            if (isAddByUser) {
                await this.git.add(status.not_added);
                await this.git.add(status.created);
                await this.git.add(status.deleted);
                await this.git.add(status.modified);
                await this.git.add(status.renamed);
                let message;
                while (!message) {
                    message = await dataTool.inquirer({
                        type: 'text',
                        message: 'please enter commit information：',
                        defaultValue: '',
                    });
                }
                await this.git.commit(message);
                log.success('local git commit successfully');
            } else {
                return false
            }

        } else {
            return true
        }
    };

    pullRemoteRepo = async (branchName, options = {}) => {
        log.notice(`synchronous remote ${branchName} branch code`);
        await this.git.pull('origin', branchName, options).catch(err => {
            if (err.message.indexOf('Permission denied (publickey)') >= 0) {
                throw new Error(`please get local ssh publickey(if you dont have: ssh-keygen -t rsa) then configure in：${this.gitServer.getSSHKeysUrl()}, configuration: ${this.gitServer.getSSHKeysHelpUrl()}`);
            } else if (err.message.indexOf('Couldn\'t find remote ref ' + branchName) >= 0) {
                log.notice('fetch remote  [' + branchName + '] branch failed');
            } else {
                log.error(err.message);
            }
            log.error('please execute [glen-build git] again, if still failed please try to remove .git directory');
            process.exit(0);
        });
    };

    // after confirm this is fork repo
    getAllBranches = async () => {
        const originBranches = await this.gitServer.getBranches(this.repo.id);
        this.originBranches = originBranches.map(el => {
            return el.name
        })
        const upstreamBranches = await this.gitServer.getBranches(this.repo.forked_from_project.id);
        this.upstreamBranches = upstreamBranches.map(el => {
            return el.name
        })
    }


    // update branch code
    updateBranch = async () => {
        // before update encure no conlict and comit 
        await this.checkConflicted();
        const noCommit = this.checkNotCommitted(false);
        if (!noCommit) {
            log.notice('you have commit info, please commit by youself')
            process.exit(0)
        }
        log.notice('fetch upstream and origin');
        this.git.fetch(['upstream']);
        this.git.fetch(['origin']);
        log.notice('start to fetch all branches')
        await this.getAllBranches();
        log.notice('start to update branch');
        const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
        log.notice('current branch->', currentBranch)
        this.currentBranch = currentBranch;
        // get local all branches
        this.localBranches = await this.git.branchLocal();
        // confirm update current branch
        const currentBranchFlag = await dataTool.inquirer({
            type: 'confirm',
            name: 'currentBranchFlag',
            default: true,
            message: `confirm update current branch: ${this.currentBranch}？`,
        })

        if (currentBranchFlag) {
            // check upstream have this branch ?
            const existUpStream = this.branchExistInRepo(this.currentBranch)
            if (existUpStream) {
                // 2.1.1 update now verify passed
                await this.branchRebase(this.currentBranch, false)
            } else {
                // 2.1.2(*)
                log.notice('can not find the same branch in upstream repo, please check it')
                process.exit(0)
            }
        } else {
            const choicesBranchs = this.upstreamBranches.map(el => ({ name: el, value: el })).filter(el=>String(el.value)!==String(this.currentBranch))
            const upstreamUpdateBranch = await dataTool.inquirer({
                type: 'list',
                choices: choicesBranchs,
                message: 'choose your origin repo branches',
            })
            log.notice(`you want to update branch: ${upstreamUpdateBranch}`);
            // check origin exist upstreamUpdateBranch
            const existUpDateStream = this.branchExistInRepo(upstreamUpdateBranch, false)
            if (existUpDateStream) {
                console.log('2.2.1')
                // 2.2.1(*) update now verify passed
                await this.branchRebase(upstreamUpdateBranch)
                console.log('updatenow')
            } else {
                console.log('2.2.2')
                // 2.2.2(*) git checkout -b newBranch upstream/newBranch; git push -u origin newBranch verify passed
                log.notice('you choice a branch is not exist in origin repo, may be the latest branch in upstream');
                if (this.localBranches.all.indexOf(upstreamUpdateBranch) >= 0) {
                    // local have so checkout
                    await this.git.checkout(upstreamUpdateBranch);
                } else {
                    // local not, origin not -> checkout -b from upstream this command change remote to upstream
                    await this.git.checkout(['-b', `${upstreamUpdateBranch}`, `upstream/${upstreamUpdateBranch}`]);
                }
                console.log('branch checkout new branch answer', upstreamUpdateBranch);
                const spinner = dataTool.spinnerStart('start push to origin...')
                try {
                    const push = await this.git.push('origin', upstreamUpdateBranch);
                    await this.git.branch(['-u', `origin/${upstreamUpdateBranch}`]);
                } catch (e) {
                    throw e;
                } finally {
                    console.log('push-------------', upstreamUpdateBranch)
                    spinner.stop(true);
                }
            }
        }
    }


    // branch exist in repo?
    branchExistInRepo = (checkBranchName, isUpstream = true) => {
        if (this.upstreamBranches && this.upstreamBranches.length) {
            const filterData = isUpstream ? this.upstreamBranches : this.originBranches
            return filterData.some(e => String(e) === String(checkBranchName))
        } else {
            throw new Error('can not fetch branchs in upstram repo');
            process.exit(0);
        }
    }

    // rebase target branch equal to source branch  name
    branchRebase = async (branch, isCheckout = true) => {
        try {
            if (isCheckout) {
                console.log('all localBranches', this.localBranches.all)
                if (this.localBranches.all.indexOf(branch) >= 0) {
                    console.log('123')
                    await this.git.checkout(branch);
                } else {
                    console.log('222')
                    await this.git.checkout(['-b', `${branch}`, `origin/${branch}`]);
                }
            }
            await this.git.pull('upstream', `${branch}`, { '--rebase': 'true' })
            return true
        } catch (e) {
            log.error(e)
            process.exit(0)
        }

    }


    // merge request

    mergeRequest = async () => {
        log.notice('you will start to merge request')
        const sourceOriginBranches = this.originBranches.map(el => ({ name: el, value: el }))
        const source_branch = await dataTool.inquirer({
            type: 'list',
            choices: sourceOriginBranches,
            message: 'choose your origin repo(source branch)',
        });
        const targetUpstreamBranches = this.upstreamBranches.map(el => ({ name: el, value: el }))
        const target_branch = await dataTool.inquirer({
            type: 'list',
            choices: targetUpstreamBranches,
            message: 'choose your upstream repo(target branch)',
        });

        const title = await dataTool.inquirer({
            type: 'text',
            message: 'please enter title of MR：',
            defaultValue: `origin ${source_branch} merge to upstream ${target_branch}`,
        });
        const target_project_id = this.repo.forked_from_project.id;
        const squash = true
        const id = this.repo.id
        const paramData = {
            id,
            target_project_id,
            source_branch,
            target_branch,
            squash,
            title
        }
        const spinner = dataTool.spinnerStart('start to merge request...')
        let res = null;
        try{
            res = await this.gitServer.creareMergeRequest(id, paramData);
        }catch(e){
            throw e;
        }finally{
            spinner.stop(true)
            log.success('merge success')
            if(res && res.web_url){
                console.log(`${dataTool.terminalLink('merge request url', res.web_url)}`) 
            }
        }
        
    }
}

module.exports = Git;