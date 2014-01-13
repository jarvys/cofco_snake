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

function BackgroundLayer() {
	this.bg = null;
	this.sprite = null;
}

BackgroundLayer.prototype = {
	constructor: BackgroundLayer,

	draw: function(render) {
		var bg = this.bg;
		var sprite = this.sprite;
		if (!bg || !sprite) {
			return;
		}

		var rect = {
			x: 0,
			y: 0,
			width: render.canvas.width,
			height: render.canvas.height
		};
		render.drawImage(bg, sprite, rect);
	}
};

function GameOverPane($el) {
	var self = this;
	this.$el = $el;
	this.$gift = this.$el.find(".gift");
	this.$tips = this.$el.find(".tips");

	this.$restart = this.$el.find(".restart");
	this.$restart.click(function() {
		if (self.onRestartHandler) {
			self.onRestartHandler();
		}
	});

	this.$share = this.$el.find(".share");
	this.$share.click(function() {
		if (self.onShareHandler) {
			self.onShareHandler();
		}
	});
}

GameOverPane.prototype = {
	show: function() {
		this.$el.show();
	},

	hide: function() {
		this.$el.hide();
		this.$share.hide();
		this.$gift.hide();
	},

	setScore: function(score) {
		if (score < 50) {
			this.$tips.html("<p>你才得了</p>" +
				"<p><span class='score'>" + score + "</span>分</p>" +
				"<p>年兽还没吃饱，还有可能出没哦！</p>" +
				"<p>继续加油吧</p>");
		} else {
			this.$tips.html("<p>你竟然得了</p>" +
				"<p><span class='score'>" + score + "</span>分</p>" +
				"<p>年兽很满足，暂时不会再来了！</p>");
		}
	},

	showGift: function() {
		this.$share.show();
		this.$gift.show();
	},

	onRestart: function(handler) {
		this.onRestartHandler = handler;
	},

	onShare: function(handler) {
		this.onShareHandler = handler;
	}
};

_Controller = {
	setupKeyBindings: function() {
		var self = this;

		function while_playing(func) {
			return function() {
				if (!self.game || self.game.status !== Game.PLAYING) {
					return;
				}

				if (func) {
					func.apply(this, arguments);
				}
			};
		}

		$(document).on("keydown", while_playing(function(e) {
			e.preventDefault();
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
		this.$currentScore.html(this.game.score());
	},

	onUploadScoreFailed: function() {
		var self = this;

		this.$errorModal.show();
		setTimeout(function() {
			self.$errorModal.hide();
			self.$overlay.hide();
		}, 2000);
	},

	onScoreUploaded: function(user) {
		this.user = u.extend(this.user, user);
		this.gameoverPane.show();
		this.$totalScore.html(user.score);
		_Controller.showInfo.call(this);
		if (this.user.winPrize) {
			this.gameoverPane.showGift();
		}
		this.gameoverPane.setScore(this.game.score());
		this.gameoverPane.show();
	},

	onUploadScoreTimeout: function() {
		_Controller.onUploadScoreFailed.call(this);
	},

	onGameFailed: function() {
		var self = this;
		this.$control.removeClass("pause");
		this.game.over();

		function _hide(func) {
			return function() {
				if (func) {
					func.apply(null, arguments);
				}
			}
		}

		this.$overlay.show();
		api.sync_score_on_mobile(this.user.member_id, this.game.score(),
			//u.delay(15 * 1000,
			u.timeup(10 * 1000,
				_hide(function(err, data) {
					if (err) {
						_Controller.onUploadScoreFailed.call(self);
					} else {
						_Controller.onScoreUploaded.call(self, data);
					}
				}), _hide(u.bind(_Controller.onUploadScoreTimeout, this))
			)
			//)
		);
	},

	loading: function() {
		var ctx = this.context;
	},

	newGame: function() {
		this.game = new Game(this.canvas);
		this.game.onMoved(u.bind(this.render.draw, this.render));
		this.game.onScoreChanged(u.bind(_Controller.onScoreChanged, this));
		this.game.onFailed(u.bind(_Controller.onGameFailed, this));
	},

	kickOff: function() {
		this.$currentScore.html(0);
		this.rounds++;
	},

	//start or resume
	resume: function() {
		_Controller.adjust.call(this);
		this.game.start();
		this.$control.addClass('pause');
	},

	pause: function() {
		this.game.pause();
		this.$control.removeClass('pause');
	},

	startGame: function() {
		_Controller.newGame.call(this);
		_Controller.kickOff.call(this);
		_Controller.resume.call(this);
		_Controller.adjust.call(this);
		this.gameLayer.setGame(this.game);
		this.render.draw();
	},

	initRender: function() {
		this.render = new Render(this.canvas);
		this.gameLayer = new GameLayer();
		this.bgLayer = new BackgroundLayer();
		this.render.addLayer(this.bgLayer);
		this.render.addLayer(this.gameLayer);
	},

	showInfo: function() {
		this.$currentScore.html(this.game ? this.game.score() : 0);
		this.$totalScore.html(this.user.score);
		this.$totalRank.html(this.user.total_rank);
		this.$currentRank.html(this.user.today_rank);
	},

	adjust: function() {
		this.el.scrollIntoView(true);
	}
};

function Controller(el) {
	var self = this;
	this.el = el;
	this.$el = $(el);
	this.$canvas = this.$el.find('canvas');
	this.canvas = this.$canvas[0];
	_Controller.initRender.call(this);

	this.user = null;
	this.rounds = 0;
}

u.extend(Controller.prototype, {
	onload: function(user) {
		var self = this;
		this.user = user;

		this.bgLayer.bg = loader.canvasImage;
		this.bgLayer.sprite = loader.canvasSprites["canvas_bg"];
		this.render.draw();

		this.$startModal = this.$el.find(".start-modal");

		if (!user) {
			this.$startModal.show();
			this.$startModal.on('click', 'button', function() {
				// TODO 跳转的指定的登录页面
				window.location = "";
			});
			return;
		}

		this.$errorModal = this.$el.find(".error-modal");

		this.$shareModal = this.$el.find(".share-modal");
		this.$shareModal.find("button").click(function() {
			self.$shareModal.hide();
			self.$overlay.hide();
			_Controller.startGame.call(self);
		});

		this.gameoverPane = new GameOverPane(this.$el.find(".gameover-modal"));
		this.gameoverPane.onRestart(function() {
			self.gameoverPane.hide();
			self.$overlay.hide();
			_Controller.startGame.call(self);
		});
		this.gameoverPane.onShare(function() {
			self.gameoverPane.hide();
			api.shareOnMobile(self.user.member_id, self.game.score(), function(err) {
				if (err) {
					console.error(err);
					self.$errorModal.show();
					setTimeout(function() {
						self.$errorModal.hide();
						self.$overlay.hide();
					}, 2000);
					return;
				}

				self.$shareModal.show();
			});
		});

		this.$overlay = this.$el.find(".snake-modal-overlay");
		this.$startModal.on('click', 'button', function() {
			self.$overlay.hide();
			self.$startModal.hide();
			_Controller.startGame.call(self);
		});
		this.$controlbar = this.$el.find(".header");

		function _ensureCanvasSize() {
			var padding = 20;
			var controlbar_height = self.$controlbar.outerHeight();
			var size = Math.min(self.$el.width() - padding * 2,
				window.innerHeight - controlbar_height);
			self.$canvas.css('width', size + "px");
			self.$canvas.css('height', size + "px");
			self.render.draw();
		}
		window.onresize = _ensureCanvasSize;
		_ensureCanvasSize();

		this.$currentScore = this.$el.find(".score .current");
		this.$totalScore = this.$el.find(".score .total");
		this.$currentRank = this.$el.find(".rank .current");
		this.$totalRank = this.$el.find(".rank .total");
		_Controller.showInfo.call(this);

		this.$control = this.$el.find(".control");
		this.$control.click(function() {
			switch (self.game.status) {
				case Game.OVER:
					_Controller.startGame.call(self);
					break;
				case Game.PAUSED:
					_Controller.resume.call(self);
					break;
				case Game.PLAYING:
					_Controller.pause.call(self);
					break;
				default:
					console.error('invlaid status', self.game.status);
			}
		});
		_Controller.setupKeyBindings.call(this);
	}
});

$(function() {
	var controller = new Controller($(".snake-container-wrap")[0]);

	async.parallel([
		loader.loadGameSpriteMeta,
		loader.loadGameSpriteImages,
		loader.getInfoInNeed
	], function(err) {
		if (err) {
			return console.error(err);
		}

		controller.onload(loader.user);
	});
});