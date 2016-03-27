/*
 * sparkline
 * https://github.com/shiwano/sparkline
 *
 * Copyright (c) 2013 Shogo Iwano
 * Licensed under the MIT license.
 */

(function(window) {
  'use strict';

  var sparkline,
      ticks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  sparkline = function(numbers) {
    var max = Math.max.apply(null, numbers),
        min = Math.min.apply(null, numbers),
        results = [],
        f, i;

    f = ~~(((max - min) << 8) / (ticks.length - 1));
    if (f < 1) { f = 1; }

    for (i = 0; i < numbers.length; i++) {
      results.push(ticks[~~(((numbers[i] - min) << 8) / f)]);
    }

    return results.join('');
  };

  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = sparkline;
  } else {
    window.sparkline = sparkline;

    if (typeof define === 'function' && define.amd) {
      define('sparkline', [], function () { return sparkline; });
    }
  }
})(this);
