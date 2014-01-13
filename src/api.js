// api
var api = {
	NETWORK_ERROR: 'network error',
	STATUS_ERROR: 'status error',
	_handle: function(callback) {
		return function(data) {
			if (typeof data === 'string') {
				data = $.parseJSON(data);
			}

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
		$.post('/game/api/addScore', params, "json")
			.done(api._handle(callback))
			.fail(api._onerror(callback));
	},

	getTotalScore: function(member_id, callback) {
		$.post('/game/api/getTotalScore', {
			member_id: member_id
		}, "json")
			.done(api._handle(callback))
			.fail(api._onerror(callback));
	},

	getUserinfo: function(callback) {
		$.post('/game/api/getMemberInfo', {}, "json")
			.done(api._handle(callback))
			.fail(api._onerror(callback));
	},

	addScoreForMobile: function(params, callback) {
		$.post('/game/api/addScoreForMobile', params, "json")
			.done(api._handle(callback))
			.fail(api._onerror(callback));
	},

	getRank: function(member_id, callback) {
		$.post('/game/api/getScoreRank', {
			member_id: member_id
		}, "json")
			.done(api._handle(callback))
			.fail(api._onerror(callback));
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

	sync_score_on_mobile: function(member_id, score, callback) {
		function _addScore(callback) {
			api.addScoreForMobile({
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
	},

	shareOnMobile: function(member_id, score, callback) {
		$.post("/game/api/share", {
			member_id: member_id,
			score: score
		}, "json")
			.done(api._handle(callback))
			.fail(api._onerror(callback));
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

	function _showLoader() {
		$("#_overflow_bg").show("fast", function() {
			$("#_overflow").show();
		});
	}

	function _hideLoader() {
		$("#_overflow_bg").hide("fast", function() {
			$("#_overflow").hide();
		});
	}

	$(function() {
		$('.close-btn').click(function() {
			$('.tk-share').hide();
			$('#over-layout').hide();
		});

		$('#dialog-huanyipi-game').click(function() {
			var page = parseInt($('#_zl_invite_page').html(), 10);
			var next = page + 1;
			$('#_zl_invite_page-game').html(next);
			getGameFriends(next);
		});

		var $alert = $("#dialog-share-alert");
		$alert.find(".close-btn-alert").click(function() {
			$alert.hide();
		});
		function showAlert(msg) {
			var width = $('#dialog-share-alert').width();
			var height = $('#dialog-share-alert').height();
			var left = (browser_width - width) / 2;
			var top = (browser_height - height) / 3;

			$alert.find("#_alert_msg_content").html(msg);
			$alert.css('position', 'fixed').css('top', top).css('left', left).css('z-index', 2001).show();
		}

		var $invite = $("#dialog-invite-game");
		var $inviteList = $("#_dzl_invite_list");

		function getGameFriends(page) {
			$.ajax({
				url: '/game/api/getMemberFriends',
				type: 'post',
				async: false,
				dataType: 'json',
				data: {
					'p': page
				},
				beforeSend: function(XMLHttpRequest) {
					_showLoader();
				},
				success: function(json) {
					_hideLoader();
					if (json.status != 1) {
						return showAlert(json.info);
					}

					var info = json.data;
					//判断下一批（如果没有第一页开始）
					if (!info.has_next) {
						$('#_zl_invite_page').html(0);
					}
					delete info.has_next;
					//判断是否显示下一批
					if (info.just_one == 1) {
						$('#dialog-huanyipi').hide();
					}
					delete info.just_one;
					for (var i in info) {
						friend = '<li>';
						friend += '<a href="javascript:;"><img src="' + info[i].head + '/100"></a>';
						friend += '<div class="check"><input type="checkbox" class="friend-at" value="' + info[i].name + '" /><span>' + info[i].nick + '</span></div>';
						friend += '</li>';
						$('#_dzl_intive_list').append(friend);
					}
				}
			});
		}

		$invite.find(".friends-share-submit").click(function() {
			var array = [];
			$inviteList.find("input[type=checkbox]").each(function() {
				var $this = $(this);
				if ($this.attr('checked') === 'checked') {
					array.push($this.val());
				}
			});

			if (array.length < 1) {
				return showAlert("至少选择一个好友");
			}

			if (array.length > 3) {
				return showAlert("最多选择三个好友");
			}

			u.each(friends, function(friend) {
				array.push("@" + friend);
			});
			friendParam = array.join(" ");

			_showLoader();
			$.post("/game/api/shareToFriends", {
				member_id: member_id,
				score: score,
				friends: friendParam
			}).done(function(data) {
				_hideLoader();
				showAlert(data.info);
			}).fail(function() {
				_hideLoader();
				showAlert("网络异常");
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
		getGameFriends(1);
		_alert("dialog-invite-game");

		member_id = _member_id;
		score = _score;
	};
})(api);