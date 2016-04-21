
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

var jsFiles = [
    'public/javascripts/src/DC.js',
    'public/javascripts/src/Config.js',
    'public/javascripts/src/Utils.js',
    'public/javascripts/src/Grid.js',
    'public/javascripts/src/UuidHistory.js',
    'public/javascripts/src/Entity.js',
    'public/javascripts/src/Disorder.js',
    'public/javascripts/src/DisorderMenu.js',
    'public/javascripts/src/EndpointMenu.js',
    'public/javascripts/src/ConnectionMenu.js',
    'public/javascripts/src/Node.js',
    'public/javascripts/src/TransparentNode.js',
    'public/javascripts/src/ScenarioPanel.js',
    'public/javascripts/src/ScenarioList.js',
    'public/javascripts/src/EntitiesPanel.js',
    'public/javascripts/src/Topology.js',
    'public/javascripts/src/TopologyPanel.js',
    'public/javascripts/src/LogPanel.js',
    'public/javascripts/src/dcmain.js',
];

gulp.task('dest', function() {
    return gulp.src(jsFiles)
            .pipe(concat('dc.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest('public/javascripts/'));
});

gulp.task('dev', function() {
    return gulp.src(jsFiles)
            .pipe(concat('dc.js'))
            .pipe(gulp.dest('public/javascripts/'));
});


gulp.task('serve', function() {
    gulp.watch('public/javascripts/src/*.js', ['dev']);
});


gulp.task('default', ['dest', 'dev']);

