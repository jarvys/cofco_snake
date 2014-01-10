var async = require('async');
var fs = require('fs');

var registerTemplates = module.exports = function(handlebars, callback) {
	async.each(["friends", "login"], function(item, callback) {
		var path = "templates/" + item + ".hbs";
		fs.readFile(path, "utf-8", function(err, data) {
			if (err) {
				return callback(err);
			}

			handlebars.registerPartial(item, data);
			callback(null);
		});
	}, function(err) {
		callback(err);
	});
};