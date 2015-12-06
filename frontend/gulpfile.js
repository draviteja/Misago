'use strict';

require('cache-require-paths');

var gulp = require('gulp');

var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var imageop = require('gulp-image-optimization');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var minify = require('gulp-minify-css');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var glob = require('glob');
var del = require('del');

var misago = '../misago/static/misago/';

// Entry points

gulp.task('watch', ['fastbuild'], function() {
  gulp.watch('src/**/*.js', ['fastsource']);
  gulp.watch('style/**/*.less', ['faststyle']);
});

gulp.task('deploy', ['build']);

// Builds

gulp.task('fastbuild', ['fastsource', 'faststyle', 'faststatic']);

gulp.task('build', [
  'source', 'style', 'static'
]);

// Source tasks

function getSources() {
  var sources = ['src/index.js'];

  function include(pattern) {
    var paths = glob.sync(pattern);
    paths.forEach(function(path) {
      sources.push(path);
    });
  };

  include('src/initializers/*.js');
  include('src/components/*.js');
  include('src/components/**/root.js');

  return sources.map(function(path) {
    return path;
  });
};

gulp.task('lintsource', function() {
  return gulp.src('src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('fastsource', ['lintsource'], function() {
  return browserify(getSources())
    .transform(babelify)
    .bundle()
    .pipe(source('misago.js'))
    .pipe(buffer())
    .pipe(gulp.dest(misago + 'js'));
});

gulp.task('source', ['lintsource'], function() {
  process.env.NODE_ENV = 'production';

  return browserify(getSources())
    .transform(babelify)
    .bundle()
    .pipe(source('misago.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(misago + 'js'));
});

// Styles tasks

gulp.task('cleanstyle', function(cb) {
  del(misago + 'css', cb);
});

gulp.task('faststyle', function() {
  return gulp.src('style/index.less')
    .pipe(less())
    .pipe(rename('misago.css'))
    .pipe(gulp.dest(misago + 'css'));
});

gulp.task('style', function() {
  return gulp.src('style/index.less')
    .pipe(less())
    .pipe(minify())
    .pipe(rename('misago.css'))
    .pipe(gulp.dest(misago + 'css'));
});

// Static tasks

gulp.task('copyfonts', function(cb) {
  return gulp.src('static/fonts/**/*')
    .pipe(gulp.dest(misago + 'fonts'));
});

gulp.task('fastcopyimages', function() {
  return gulp.src('static/img/**/*')
    .pipe(gulp.dest(misago + 'img'));
});

gulp.task('copyimages', function() {
  return gulp.src('static/img/**/*')
    .pipe(imageop({
      optimizationLevel: 9
    }))
    .pipe(gulp.dest(misago + 'img'));
});

gulp.task('faststatic', ['copyfonts', 'fastcopyimages']);

gulp.task('static', ['copyfonts', 'copyimages']);

// Vendor tasks


// Test task

gulp.task('linttests', function() {
  return gulp.src(['tests/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('test', ['linttests', 'lintsource'], function() {
  var mochify = require('mochify');
  mochify('tests/**/*.js')
    .transform(babelify)
    .bundle();
});
