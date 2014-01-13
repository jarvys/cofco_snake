#中粮贪食蛇游戏项目

##使用说明
需要使用nodejs和相关的开发工具才能启动服务，不过public当中有导出的所有静态文件


##开发
###具体的搭建步骤：
```
git clone https://github.com/jiarvis/cofco_snake

npm install -g bower lessc grunt-cli   #安装bower，less和grunt

npm install    #安装依赖 
bower install

node app.js   #运行服务 
```

访问http://localhost:3000


###导出静态文件:
```
grunt templates   #导出html文件
grunt sprite   #导出图片
grunt less   #导出css文件
grunt   #导出代码
```

其他功能详见Gruntfile.js
