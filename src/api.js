// api
var api = {
	NETWORK_ERROR: 'network error',
	STATUS_ERROR: 'status error',
	_handle: function(callback) {
		return function(data) {
			if (data.status != 1) {
				return callback(api.STATUS_ERROR);
			}

			callback(null, data.data);
		};
	},

	_onerror: function(callback) {
		return function() {
			callback(api.NETWORK_ERROR);
		};
	},

	addScore: function(params, callback) {
		$.get('/game/api/addScore', params, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getTotalScore: function(member_id, callback) {
		$.get('/game/api/getTotalScore', {
			member_id: member_id
		}, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getUserinfo: function(callback) {
		$.get('/game/api/getMemberInfo', {}, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	getRank: function(member_id, callback) {
		$.get('/game/api/getScoreRank', {
			member_id: member_id
		}, "json")
			.success(api._handle(callback))
			.error(api._onerror(callback));
	},

	// 获取用户信息：获取用户信息-->获取用户排名
	getInfoInNeed: function(callback) {
		function _getUserInfo(callback) {
			api.getUserinfo(function(err, user) {
				if (err) {
					return callback(err);
				}

				callback(null, user);
			});
		}

		function _getRank(user, callback) {
			api.getRank(user.member_id, function(err, rank) {
				if (!err) {
					u.extend(user, rank);
				}
				callback(null, user);
			});
		}

		async.waterfall([_getUserInfo, _getRank],
			//u.delay(5 * 1000,
			function(err, user) {
				if (err) {
					return callback(err);
				}

				callback(null, user);
				// callback(null, null);
			}
			//)
		);
	},

	// 同步积分，上传积分-->获取用户信息-->获取用户排名
	sync_score: function(member_id, score, callback) {
		function _addScore(callback) {
			api.addScore({
				member_id: member_id,
				score: score
			}, function(err, data) {
				if (err) {
					return callback(err);
				}

				callback(null, data.winPrize);
			});
		}

		function _getUserInfo(winPrize, callback) {
			api.getUserinfo(function(err, user) {
				if (err) {
					return callback(err);
				}

				user.winPrize = winPrize;
				callback(null, user);
			});
		}

		function _getRank(user, callback) {
			api.getRank(member_id, function(err, rank) {
				if (!err) {
					u.extend(user, rank);
				}
				callback(null, user);
			});
		}

		async.waterfall([_addScore, _getUserInfo, _getRank],
			//u.delay(5 * 1000,
			function(err, user) {
				if (err) {
					return callback(err);
				}

				callback(null, user);
			}
			//)
		);
	}
};

(function(module) {
	var browser_width = $(window).width();
	var browser_height = $(window).height();

	function _alert(id) {
		var width = $('#' + id).width();
		var height = $('#' + id).height();
		var left = (browser_width - width) / 2;
		var top = (browser_height - height) / 3;

		$('#' + id).css('position', 'fixed').css('top', top).css('left', left).css('z-index', 2000).show();
		$('#over-layout').show();
	}

	$(function() {
		$('.close-btn').click(function() {
			$('.tk-share').hide();
			$('#over-layout').hide();
		});

		$("#friends-share-submit").click(function() {
			var array = [];
			u.each(friends, function(friend) {
				array.push("@" + friend);
			});
			friendParam = array.join(" ");

			$.post("/game/api/shareToFriends", {
				member_id: member_id,
				score: score,
				friends: friendParam
			}).success(function(data) {
				alert(data);
			}).error(function() {
				alert('error');
			});
		});
	});

	module.login = function() {
		_alert("_auth_xxx");
	};

	var member_id;
	var score;
	var friends = [];

	module.share = function(_member_id, _score) {
		_alert("_friend_xxx");

		member_id = _member_id;
		score = _score;
	};
})(api);