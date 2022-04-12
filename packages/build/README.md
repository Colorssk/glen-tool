**#** **`@glen-tool/build`**



\> glen-tool: build: description



**## Usage**



how to use it: 



*command:* 

```
 glen-build: execute
```

then 

  select your project type

 ```
[options: 

​	reactOverrides -> react webpack config,

​	vue -> vue webpack config

]
 ```

then

  select your comman(you want to run/build/...)

```
[options:

​	run -> execute the script of run,

​	build -> execute the script of build,

​    ...

]


```

// 目前的方向，是在run的时候就植入pre-push 或者 pre-commit 去规范,例如第一步: 规范提交的commit message信息 

//  redux/fetch 这块还是可以把他从fore-core集成下来
第一个是「以不变为中心」
第二个是「各层皆可替换」
第三个是「视图层尽可能薄」

git化操作， 命令执行直接执行merge操作，前一步也支持commit和push


ps: 考虑设计组件测试环境


pre-msg 已可实现windows校验消息格式, pre-commit校验没有改动需要固定的几个包的版本， yarn.lock检测是否有关于react或者antd版本的更新

step1：实现功能msg自动填充+msg校验自定义： 执行命令： glen-build run --script=react-script/start --targetPath=commitRules

