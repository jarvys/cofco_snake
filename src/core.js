DIRECTION_LEFT = 'left';
DIRECTION_RIGHT = 'right';
DIRECTION_UP = 'up';
DIRECTION_DOWN = 'down';

INVERSE_DIRECTION = {
    up: DIRECTION_DOWN,
    left: DIRECTION_RIGHT,
    right: DIRECTION_LEFT,
    down: DIRECTION_UP
};

function Snake(blocks, length) {
    this.blocks = blocks;

    this.direction = DIRECTION_LEFT;
    this.directionChanged = false;

    this.x = Math.ceil(this.blocks / 2);
    this.y = Math.ceil(this.blocks / 2);
    this.sections = [];
    for (var i = this.x + length - 1; i >= this.x; i--) {
        this.sections.push({
            x: i,
            y: this.y
        });
    }
}

Snake.prototype = {

    changeDirection: function(direction) {
        if (this.directionChanged) return;

        if (direction === INVERSE_DIRECTION[this.direction]) return;

        this.direction = direction;
        this.directionChanged = true;
    },

    bumpSelf: function() {
        return this.onBody(this.x, this.y);
    },

    onBody: function(x, y) {
        for (var i = 0; i < this.sections.length; i++) {
            var section = this.sections[i];
            if (section.x === x && section.y === y) return true;
        }

        return false;
    },

    move: function() {
        switch (this.direction) {
            case DIRECTION_UP:
                this.y--;
                break;
            case DIRECTION_DOWN:
                this.y++;
                break;
            case DIRECTION_LEFT:
                this.x--;
                break;
                //case DIRECTION_RIGHT:
            default:
                this.x++;
        }
    },
};

var _Game = {
    triggerScoreChanged: function() {
        if (this.scoreListener) this.scoreListener();
    }
};

function Game(canvas) {
    var self = this;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.blocks = Game.BLOCKS;
    this.block_size = this.canvas.width / this.blocks;

    this.snake = new Snake(this.blocks, 5);
    this.foods = [];
    this.food = this.getFood();
    this.scoreListener = null;

    this.status = Game.INITIALIZED;
    this.failListener = null;

    this.timer = new Timer(function() {
        self.snake.move();
        if (self.isCollision()) {
            self.timer.pause();
            self.fail();
            return;
        }

        self.snake.directionChanged = false;
        if (self.snake.x == self.food.x && self.snake.y == self.food.y) {
            self.foods.push(self.food);
            if (self.foods.length % 5 === 0) self.timer.speedUp();
            _Game.triggerScoreChanged.call(self);
            self.food = self.getFood();
        } else {
            self.snake.sections.shift();
        }
        self.snake.sections.push({
            x: self.snake.x,
            y: self.snake.y
        });

        requestAnimationFrame(function() {
            self.draw();
        });
    });
}

u.extend(Game, {
    BLOCKS: 10,
    INITIALIZED: 'initialized',
    PLAYING: 'playing',
    PAUSED: 'paused',
    OVER: 'over'
});

Game.prototype = {
    contructor: Game,

    start: function() {
        var self = this;
        if (this.status !== Game.INITIALIZED &&
            this.status !== Game.PAUSED) {
            console.error('wrong status');
            return;
        }

        this.status = Game.PLAYING;
        this.timer.start();
        requestAnimationFrame(function() {
            self.draw();
        });
    },

    pause: function() {
        this.timer.pause();
        this.status = Game.PAUSED;
    },

    fail: function() {
        this.status = Game.OVER;
        if (this.failListener) this.failListener();
    },

    onFailed: function(l) {
        this.failListener = l;
    },

    isCollision: function() {
        if (this.snake.x < 0 || this.snake.x >= this.blocks ||
            this.snake.y < 0 || this.snake.y >= this.blocks) return true;

        return this.snake.bumpSelf();
    },

    resetCanvas: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    score: function() {
        var score = 0;
        u.each(this.foods, function(food) {
            score += food.score;
        });
        return score;
    },

    onScoreChanged: function(l) {
        this.scoreListener = l;
    },

    drawSnake: function() {
        for (var i = 0; i < this.snake.sections.length; i++) {
            var section = this.snake.sections[i];
            if (i === 0) {
                this.drawSnakeTail(section);
            } else if (i === this.snake.sections.length - 1) {
                this.drawSnakeHead(section);
            } else {
                this.drawSnakeBody(section);
            }
        }
    },

    drawImage: function(section, img) {
        var context = this.context;
        context.drawImage(img, section.x * this.block_size,
            section.y * this.block_size,
            this.block_size, this.block_size);
    },

    drawSnakeBody: function(section) {
        this.drawImage(section, META.snake.body.img);
    },

    drawSnakeTail: function(section) {
        this.drawImage(section, META.snake.tail.img);
    },

    drawSnakeHead: function(section) {
        this.drawImage(section, META.snake.head.img);
    },

    drawFood: function() {
        this.drawImage(this.food, this.food.img);
    },

    drawBox: function(x, y, size, color) {
        var context = this.context;
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + size, y);
        context.lineTo(x + size, y + size);
        context.lineTo(x, y + size);
        context.closePath();
        context.fill();
    },

    draw: function() {
        this.resetCanvas();
        this.drawFood();
        this.drawSnake();
    },

    changeSnakeDirection: function(direction) {
        this.snake.changeDirection(direction);
    },

    getFood: function() {
        var _food = Fooder.getFood();
        var pos = this.getNewFoodPosition();
        return u.extend({}, _food, pos);
    },

    getNewFoodPosition: function() {
        var pos = {};

        do {
            pos.x = Math.floor(Math.random() * this.blocks);
            pos.y = Math.floor(Math.random() * this.blocks);
        } while (this.snake.onBody(pos.x, pos.y));

        return pos;
    }
};

var DIRECTION_KEYCODES = {
    up: [38, 75, 87],
    down: [40, 74, 83],
    left: [37, 65, 72],
    right: [39, 68, 76],
};

function getDirectionByKeyCode(keyCode) {
    for (var key in DIRECTION_KEYCODES) {
        var codelist = DIRECTION_KEYCODES[key];
        if (~u.indexOf(codelist, keyCode)) {
            return key;
        }
    }

    return null;
}

var _Controller = {
    setupKeyBindings: function() {
        var self = this;

        function while_playing(func) {
            return function() {
                if (self.game.status !== Game.PLAYING) return;
                if (func) func.apply(this, arguments);
            };
        }

        $(document).on("keydown", while_playing(function(e) {
            var direction = getDirectionByKeyCode(e.keyCode);
            if (direction) self.game.changeSnakeDirection(direction);
        }));

        var hammer = $(document).hammer();

        hammer.on('touchmove', while_playing(function(e) {
            e.preventDefault();
        })).on("swipeup, dragup", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('up');
        })).on("swipedow dragdown", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('down');
        })).on("swipeleft dragleft", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('left');
        })).on("swiperight dragright", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('right');
        }));
    },

    onScoreChanged: function() {
        this.currentScoreEl.innerHTML = this.game.score();
    },

    onUploadScoreFailed: function() {
        // TODO
        console.error('failed to upload score');
    },

    onScoreUploaded: function(user) {
        console.log('score has been uploaded');
        this.showTotalScore(user.score);
    },

    onUploadScoreTimeout: function() {
        console.log('upload score: time is up');
    },

    onGameFailed: function() {
        var self = this;

        $(this.controlButton).removeClass('control-pause');
        $(this.controlButton).removeClass('control-play');
        this.currentScoreEl.innerHTML = 0;

        var STATUS_UPLOADING = 'uploading';
        var STATUS_UPLOADED = 'uploaded';
        var STATUS_TIMEOUT = 'timeout';
        var status = STATUS_UPLOADING;

        function _on_uploading(round, func) {
            return function() {
                if (round !== self.rounds ||
                    status !== STATUS_UPLOADING) {
                    return;
                }

                if (func) func.apply(this, arguments);
            };
        }

        setTimeout(_on_uploading(this.rounds, function() {
            status = STATUS_TIMEOUT;

            _Controller.onUploadScoreTimeout.call(self);
        }), 15 * 1000);

        server.sync_score({
            score: this.game.score()
        }, _on_uploading(this.rounds, function(err, data) {
            status = STATUS_UPLOADED;

            if (err) {
                console.error(err);
                _Controller.onUploadScoreFailed.call(self);
            } else {
                console.log(data);
                _Controller.onScoreUploaded.call(self, data);
            }
        }));

        this.game = new Game(this.canvas);
        this.game.onScoreChanged(u.bind(_Controller.onScoreChanged, this));
        this.game.onFailed(u.bind(_Controller.onGameFailed, this));
    }
};

function Controller() {
    this.rounds = 0;
}

Controller.prototype = {

    onload: function(canvas) {
        var self = this;

        this.canvas = canvas;
        this.game = new Game(this.canvas);
        this.currentScoreEl = document.getElementById('current-score');
        this.totalScoreEl = document.getElementById('total-score');

        this.controlButton = document.getElementById('control');
        this.controlButton.onclick = function() {
            switch (self.game.status) {
                case Game.OVER:
                case Game.INITIALIZED:
                    self.game.start();
                    $(this).addClass('control-play');
                    $(this).removeClass('control-pause');
                    self.rounds++;
                    break;
                case Game.PAUSED:
                    self.game.start();
                    $(this).addClass('control-play');
                    $(this).removeClass('control-pause');
                    break;
                default:
                    //Game.PLAYING
                    self.game.pause();
                    $(this).addClass('control-pause');
                    $(this).removeClass('control-play');
            }
        };

        _Controller.setupKeyBindings.call(this);

        this.game.onScoreChanged(u.bind(_Controller.onScoreChanged, this));
        this.game.onFailed(u.bind(_Controller.onGameFailed, this));
    },

    showTotalScore: function(totalScore) {
        this.totalScoreEl.innerHTML = totalScore;
    }
};

var META = {
    snake: {
        head: {
            src: '/images/Festive-icon.png'
        },
        tail: {
            src: '/images/Snowy-icon.png'
        },
        body: {
            src: '/images/Wreath-icon.png'
        }
    },
    foods: {
        zhongcha: {
            score: 1,
            name: '中茶',
            src: '/images/zhongcha.png'
        },
        wugu: {
            score: 1,
            name: '五谷',
            src: '/images/wugu.png'
        },
        mengniu: {
            score: 1,
            name: '蒙牛',
            src: '/images/mengniu.png'
        },
        jindi: {
            score: 1,
            name: 'jingdi',
            src: '/images/jindi.png'
        },
        jiajiakang: {
            score: 1,
            name: '家佳康',
            src: '/images/jiajiakang.png'
        },
        changcheng: {
            score: 1,
            name: '长城',
            src: '/images/changcheng.png'
        },
        fulinmen: {
            score: 1,
            name: '福临门',
            src: '/images/fulinmen.png'
        },
        yuehuo: {
            score: 1,
            name: 'yuehuo',
            src: '/images/yuehuo.png'
        }
    }
};

var Fooder = {
    getFood: function() {
        var keyset = u.keys(META.foods);
        if (keyset.length === 0) return null;

        var index = Math.floor(Math.random() * keyset.length);
        return META.foods[keyset[index]];
    }
};

function loadResources() {
    var promise = {};

    var items = [];
    u.each(u.keys(META.snake), function(key) {
        items.push(META.snake[key]);
    });
    u.each(u.keys(META.foods), function(key) {
        items.push(META.foods[key]);
    });

    var completed = 0;
    async.each(items, function(item, callback) {
        var img = new Image();

        img.onload = function() {
            item.img = img;
            completed++;
            if (promise.progress) promise.progress(completed, items.length);
            callback(null);
        };

        img.onerror = function() {
            console.log('fail to load img:', item.src);
            callback('error');
        };
        img.src = item.src;
    }, function(err) {
        if (err) {
            if (promise.fail) promise.fail(err);
        } else {
            if (promise.success) promise.success();
        }
    });

    return promise;
}

var controller = new Controller();

$(function() {
    canvas = document.getElementById("snake");
    if (!canvas.getContext) G_vmlCanvasManager.initElement(canvas);

    function _load(callback) {
        var promise = loadResources();
        promise.success = function() {
            callback(null);
        };

        promise.progress = function(completed, length) {
            // TODO
            console.log('progress:', completed, length);
        };

        promise.fail = function(err) {
            console.error(err);
            callback(err);
        };
    }

    function _get_info(callback) {
        server.info(function(err, data) {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        });
    }

    async.parallel([_load, _get_info], function(err, results) {
        var data = results[1];
        controller.onload(canvas);
        controller.showTotalScore(data.score);
    });
});