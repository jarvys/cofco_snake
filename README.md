#中粮贪食蛇游戏项目

##使用说明
需要使用nodejs和相关的开发工具才能启动服务，不过public当中有导出的所有静态文件

###工程结构和重要文件介绍：
```
cofco_snake  
├── app.js  #测试服务代码  
├── dist    #所有的静态文件
│   ├── Public   #游戏本身需要的静态文件
│   │   └── game
│   │       ├── css
│   │       ├── fonts
│   │       ├── images
│   │       ├── js
│   │       └── json
│   ├── css  #用到的网站的全局样式
│   └── images  #用到的网站网站全局图片
├── src
│   ├── api.js    #!!!封装ajax接口、分享和登录模块   
│   ├── desktop.js    #!!!pc版游戏的控制模块
│   ├── mobile.js   #!!!mobile版的控制模块 
│   └── ... 
└── templates   #服务使用的页面模板  
    ├── desktop.hbs    #pc版游戏模板
    ├── friends.hbs    #好友列表弹出框模板
    ├── login.hbs    #授权登录弹出框模板
    └── mobile.hbs    #mobile版游戏模板
```


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
