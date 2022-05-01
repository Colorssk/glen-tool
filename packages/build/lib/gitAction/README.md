简化的git 操作

fork的仓库手动创建和拉取（没有简化的必要）
per： set token， get username(就从token中读取), get repo（实时） host gitlab.xxxx.com 由host参数指定
(如果仓库不是fork到你自己的名下的，get repo会找不到对应的信息（强制要求是你自己的仓库）)
无init的初始操作
1：git init check/execute(是否有init文件(有可能是拷贝下来的项目))(和远程关联)
2: git add upstream remote （need gitlab api to get info）(和远程fork的原仓库关联)
// 准备工作结束

// 有init的操作
3： 指令：fresh  git pull upstream and update origin
4：指令: merge   merge request git api（need to use gitlab api）



=》 更新操作：
1： git fetch upstream 先更新上游(upstream)代码;
2:  是否更新本分支

2.1： ->是: 校验远程是否包含此分支 

2.1.1(*): ->是: 立即更新(git rebase) passed

2.1.2(*)： ->否：停止进程（告知用户，无法自动更新，远程没有和当前分支同名的分支）clear

2.2： ->否: 从上游upstream中选择需要更新的分支，上游upstream选中的分支本地是否含有

2.2.1(*)： ->是：立即更新(git rebase)

2.2.2(*)： -> 否： git branch -b newBranch upstream/newBranch; git push -u origin newBranch


merge 操作：
1： origin分支和upstream分支的merge和本地无关，所以直接发出强求