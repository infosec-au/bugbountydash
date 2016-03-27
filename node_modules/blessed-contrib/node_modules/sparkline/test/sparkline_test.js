'use strict';

var sparkline = require('../lib/sparkline.js'),
    exec = require('child_process').exec;

exports['sparkline'] = {
  'default': function(test) {
    var arg = [1, 5, 22, 13, 5];
    test.equal(sparkline(arg), '▁▂█▅▂');
    test.done();
  },

  'decimal': function(test) {
    var arg = [5.5, 20];
    test.equal(sparkline(arg), '▁█');
    test.done();
  },

  '100 lt 300': function(test) {
    var arg = [1, 2, 3, 4, 100, 5, 10, 20, 50, 300];
    test.equal(sparkline(arg), '▁▁▁▁▃▁▁▁▂█');
    test.done();
  },

  '50 lt 100': function(test) {
    var arg = [1, 50, 100];
    test.equal(sparkline(arg), '▁▄█');
    test.done();
  },

  '4 lt 8': function(test) {
    var arg = [2, 4, 8];
    test.equal(sparkline(arg), '▁▃█');
    test.done();
  },

  'no tier 0': function(test) {
    var arg = [1, 2, 3, 4, 5];
    test.equal(sparkline(arg), '▁▂▄▆█');
    test.done();
  },

  'default on bin': function(test) {
    var child = exec('./bin/sparkline 1,5,22,13,5', {timeout: 3000}, function(err, stdout, stderr) {
      test.equal(stdout.replace(/\n$/, ''), '▁▂█▅▂');
      test.done();
    });
  },

  'pipe data on bin': function(test) {
    var child = exec('echo 0,30,55,80,33,150 | ./bin/sparkline', {timeout: 3000}, function(err, stdout, stderr) {
      test.equal(stdout.replace(/\n$/, ''), '▁▂▃▄▂█');
      test.done();
    });
  },

  'spaced data on bin': function(test) {
    var child = exec('./bin/sparkline 0 30 55 80 33 150', {timeout: 3000}, function(err, stdout, stderr) {
      test.equal(stdout.replace(/\n$/, ''), '▁▂▃▄▂█');
      test.done();
    });
  },

  'way spaced data on bin': function(test) {
    var child = exec('./bin/sparkline 0 30               55 80 33     150', {timeout: 3000}, function(err, stdout, stderr) {
      test.equal(stdout.replace(/\n$/, ''), '▁▂▃▄▂█');
      test.done();
    });
  },
};
