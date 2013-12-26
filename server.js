#!/usr/bin/env node

var express = require('express');

var app = express();
app.use(express.logger());
app.use(express.static(__dirname + '/demo'));
app.use("/libs", express.static(__dirname + '/bower_components'));
app.use("/images", express.static(__dirname + '/images'));

var user = {
	id: 0,
	score: 0
}

app.post('/test/info', function(req, res) {
	res.send({
		status: 1,
		data: user
	});
});

app.post('/test/sync_score', function(req, res) {
	var score = parseInt(req.query.score, 10)
	user.total += score;
	res.send({
		status: 1,
		data: {
			id: user.id,
			gift: score > 500
		}
	})
});

app.listen(11111);
console.log('Listening on port 11111');