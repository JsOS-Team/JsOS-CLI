// Copyright 2015-present runtime.js project authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
let chalk = require('chalk');
let shell = require('shelljs');
let running = [];

process.on('SIGINT', function () {
  running.forEach(function (p) {
    p.kill('SIGINT');
  });

  shell.echo(chalk.yellow(' --- interrupted --- '));
  process.exit(0);
});

module.exports = (cmd, cb) => new Promise((resolve, reject) => {
  let p = global.SPAWNED_PROCESS = shell.exec(cmd, { async: true }, (code, output) => {
    global.SPAWNED_PROCESS = null;
    let index = running.indexOf(p);
    if (index > -1) {
      running.splice(index);
    }

    if ('function' === typeof cb) {
      cb(code, output);
    }

    return code ? reject(code, output) : resolve(code, output);
  });

  running.push(p);
})
