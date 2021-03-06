var async = require("async");
var fs = require("fs");
var handlebars = require("handlebars");
var registerTemplates = require("./templates");

module.exports = function(grunt) {
    var common = [
        'src/animation.js',
        'src/utils.js',
        'src/cookie.js',
        'src/api.js',
        'src/timer.js',
        'src/loader.js',
        'src/game.js',
        'src/render.js',
    ];

    var sources = {
        desktop: ['src/head.js']
            .concat(common)
            .concat([
                'src/desktop.js',
                'src/tail.js'
            ]),
        mobile: ['src/head.js']
            .concat(common)
            .concat([
                'src/mobile.js',
                'src/tail.js'
            ])
    };

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        async: 'bower_components/async/lib/async.js',
        static_dir: 'dist/Public/game',

        sprite: {
            resources: {
                src: "images/res/*.png",
                destImg: '<%= static_dir %>/images/resources.png',
                destCSS: 'less/resources.less',
                imgPath: '../images/resources.png',
                padding: 10,
                cssOpts: {
                    'cssClass': function(item) {
                        return '.snake-' + item.name;
                    }
                }
            },
            foods: {
                src: "images/food/*.png",
                destImg: '<%= static_dir %>/images/foods.png',
                padding: 10,
                destCSS: '<%= static_dir %>/json/foods.json'
            },
            snake: {
                src: "images/snake/*.png",
                destImg: '<%= static_dir %>/images/snake.png',
                padding: 10,
                destCSS: '<%= static_dir %>/json/snake.json'
            },
            canvas: {
                src: "images/res/canvas_bg.png",
                destImg: '<%= static_dir %>/images/canvas.png',
                padding: 10,
                destCSS: '<%= static_dir %>/json/canvas.json'
            },
            mobile: {
                src: "images/mobile/*.png",
                destImg: '<%= static_dir %>/images/mobile.png',
                padding: 10,
                destCSS: 'less/mobile_res.less',
                imgPath: '../images/mobile.png',
                cssOpts: {
                    cssClass: function(item) {
                        return '.snake-' + item.name;
                    }
                }
            }
        },
        less: {
            prod: {
                options: {
                    cleancss: true
                },
                files: {
                    "<%= static_dir %>/css/snake.desktop.min.css": "less/snake.desktop.less",
                    "<%= static_dir %>/css/snake.mobile.min.css": "less/snake.mobile.less"
                }
            },
            development: {
                files: {
                    "<%= static_dir %>/css/snake.desktop.css": "less/snake.desktop.less",
                    "<%= static_dir %>/css/snake.mobile.css": "less/snake.mobile.less"
                }
            }
        },
        env: {
            dev: {
                NODE_ENV: 'development',
                FEEDBACK: 'false'
            }
        },
        express: {
            dev: {
                options: {
                    background: true,
                    debug: true,
                    script: 'app.js'
                }
            }
        },
        concat: {
            options: {
                separator: '\n\n;\n\n'
            },
            desktop: {
                src: sources.desktop,
                dest: '<%= static_dir %>/js/<%= pkg.name %>.desktop.js',
            },
            mobile: {
                src: sources.mobile,
                dest: '<%= static_dir %>/js/<%= pkg.name %>.mobile.js'
            }
        },
        uglify: {
            options: {
                banner: "/*! <%=pkg.name%> <%=grunt.template.today('yyyy-mm-dd')%> */\n"
            },
            desktop: {
                src: '<%= concat.desktop.dest %>',
                dest: '<%= static_dir %>/js/<%= pkg.name %>.desktop.min.js',
            },
            mobile: {
                src: '<%= concat.mobile.dest %>',
                dest: '<%= static_dir %>/js/<%= pkg.name %>.mobile.min.js',
            }
        },

        jshint: {
            src: [
                'Gruntfile.js',
                'app.js'
            ]
        },

        watch: {
            express: {
                files: ['templates/index.hbs', 'Gruntfile.js', 'app.js', 'src/*.js', 'templates/*.hbs'],
                tasks: ['default', 'env:dev', 'express:dev'],
                options: {
                    spawn: false
                }
            },
            styles: {
                files: ['less/**/*.less'],
                tasks: ['less']
            },
            templates: {
                files: ['templates/**/*.hbs'],
                tasks: ['templates']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-spritesmith');

    grunt.registerTask('test', []);
    grunt.registerTask('server', ['default', 'env:dev', 'express:dev', 'watch:express']);
    grunt.registerTask('default', ['concat', 'jshint', 'uglify']);
    grunt.registerTask('generate', ['default', 'less', 'templates', 'sprite']);
    grunt.registerTask('templates', 'generate templates', function() {
        var done = this.async();

        registerTemplates(handlebars, function(err) {
            if (err) {
                return done(false);
            }

            async.each(["mobile", "desktop"], compile, function(err) {
                if (err) {
                    done(false);
                } else {
                    done();
                }
            });
        });

        function compile(item, callback) {
            var path = "templates/" + item + ".hbs";
            fs.readFile(path, "utf-8", function(err, data) {
                if (err) {
                    return callback(err);
                }

                var template = handlebars.compile(data);
                var html = template({
                    DEBUG: true,
                    FEEDBACK: false
                });
                var to = "dist/" + item + ".html";
                fs.writeFile(to, html, function(err) {
                    if (err) {
                        return callback(err);
                    }

                    callback(null);
                });
            });
        }
    });
};