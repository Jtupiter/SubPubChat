module.exports = function(grunt) {
    var libsjs = [
    'bower_components/jquery/jquery.js',
    'bower_components/underscore/underscore.js',
    'bower_components/backbone/backbone.js',
    'bower_components/sockjs/sockjs.js',
    'bower_components/bootstrap/dist/js/bootstrap.js'
  ];

  // Project configuration.
  grunt.initConfig({
    uglify: {
      build: {
        files: {
          'public/libs.js': libsjs
        }
      }
    },
    jst: {
      compile: {
        options: {
          namespace: "TMJST"
        },
        files: {
          "public/templates.js": [
            "public/templates/*.html"
          ]
        }
      }
    },
    cssmin: {
      combine: {
        files: {
          'public/style.css': ['bower_components/bootstrap/dist/css/bootstrap.css', 'public/index.css']
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jst');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default Task
  grunt.registerTask('default', ['cssmin', 'uglify', 'jst']);
};