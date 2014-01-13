#!/usr/bin/env node

var util = require('util');
var async = require("async");
var express = require('express');
var useragent = require('express-useragent');
var handlebars = require('handlebars');
var registerTempltes = require("./templates");
var fs = require('fs');


var user = {
	id: 0,
	score: 2000,
	today_rank: 200,
	total_rank: 2000
};


registerTempltes(handlebars, function(err) {
	if (err) {
		throw err;
	}

	startServer();
});


function startServer() {
	var app = express();
	app.use(express.logger('dev'));
	app.use(express.static(__dirname + '/dist'));
	app.use(useragent.express());
	app.use(express.bodyParser());

	app.post('/game/api/shareToFriends', function(req, res) {
		res.send({
			status: 1,
			info: '',
			data: {}
		});
	});

	app.post('/game/api/getMemberInfo', function(req, res) {
		res.send({
			status: 1,
			info: '',
			data: {
				member_id: user.id,
				nickname: 'Jarvis',
				profile_url: '',
				score: user.score
			}
		});
	});

	var addScore = function(req, res) {
		var score = parseInt(req.param("score"), 10);
		var member_id = parseInt(req.param("member_id"), 10);

		user.score += score;
		if (score > 0) {
			user.today_rank = Math.max(0, --user.today_rank);
			user.total_rank = Math.max(0, --user.total_rank);
		}

		res.send({
			status: 1,
			info: '',
			data: {
				winPrize: score >= 50
			}
		});
	};

	app.post('/game/api/addScore', addScore);
	app.post('/game/api/addScoreM', function(req, res) {
		var score = parseInt(req.param("score"), 10);
		var member_id = parseInt(req.param("member_id"), 10);

		user.score += score;
		if (score > 0) {
			user.today_rank = Math.max(0, --user.today_rank);
			user.total_rank = Math.max(0, --user.total_rank);
		}

		res.send({
			status: 1,
			info: '',
			data: {
				has_chance_win_prize: score >= 50
			}
		});
	});

	app.post('/game/api/getTotalScore', function(req, res) {
		var member_id = parseInt(req.param("member_id"), 10);

		res.send({
			status: 1,
			info: '',
			data: user
		});
	});

	app.post('/game/api/shareM', function(req, res) {
		res.send({
			status: 1,
			data: {
				winPrize: true
			}
		});
	});

	app.post('/game/api/getScoreRank', function(req, res) {
		var member_id = parseInt(req.param("member_id"), 10);

		// TODO 修改成两种排名
		res.send({
			status: 1,
			info: '',
			data: user
		});
	});

	app.get('/', function(req, res) {
		res.redirect(req.useragent.isDesktop ? '/desktop' : 'mobile');
	});

	var _desktop_template = null;
	app.get('/desktop', function(req, res, next) {
		fs.readFile("templates/desktop.hbs", "utf-8", function(err, data) {
			if (err) {
				return next(err);
			}

			_desktop_template = _desktop_template || handlebars.compile(data);
			var html = _desktop_template({
				DEBUG: process.env.NODE_ENV === 'development'
			});
			res.send(html);
		});
	});

	var feedback = true;
	if (process.env.FEEDBACK === 'false') {
		feedback = false;
	}

	var _mobile_template = null;
	app.get('/mobile', function(req, res, next) {
		fs.readFile("templates/mobile.hbs", "utf-8", function(err, data) {
			if (err) {
				return next(err);
			}

			_mobile_template = _mobile_template || handlebars.compile(data);
			var html = _mobile_template({
				DEBUG: process.env.NODE_ENV === 'development',
				FEEDBACK: feedback
			});
			res.send(html);
		});
	});

	app.listen(process.argv.length > 2 ? process.argv[2] : 3000);
}