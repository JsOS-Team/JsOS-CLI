#!/usr/bin/env node
// Copyright 2015-present runtime.js project authors
// Copyright 2017-use JsOS project authors
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

const parseArgs = require('minimist');
const pad = require('pad');
const chalk = require('chalk');
const tabtab = require('tabtab');
const version = require('../package.json').version;

const packArgs = [
  {
    "name": 'list-files',
    "type": 'boolean',
    "default": false,
    "description": 'List packaged files only'
  },
  {
    "name": 'ignore',
    "type": 'string',
    "default": '',
    "description": 'Add file ignore pattern'
  },
  {
    "name": 'entry',
    "type": 'string',
    "default": '/',
    "description": 'Set entry point import/require string (defaults to "/")'
  },
  {
    "name": 'add-dir',
    "type": 'string',
    "default": '',
    "description": 'Add a directory into the package (format: <path> or <path>:<package-path>)'
  },
  {
    "name": 'output',
    "type": 'string',
    "default": '',
    "description": 'Initrd output file (defaults to .initrd)\nformat: --output <initrd name> or --output <directory/initrd name>'
  }
];

const runArgs = [
  {
    "name": 'net',
    "type": 'string',
    "default": 'user',
    "description": 'Enable network (value can be "none", "user", "tap" or\n"bridge", defaults to "user")'
  },
  {
    "name": 'netdev',
    "type": 'string',
    "default": 'virtio',
    "description": 'Set network device model (defaults to "virtio")'
  },
  {
    "name": 'netdump',
    "type": 'boolean',
    "default": false,
    "description": 'Save network activity to a file'
  },
  {
    "name": 'kvm',
    "type": 'boolean',
    "default": false,
    "description": 'Enable Linux KVM (much faster virtualization)'
  },
  {
    "name": 'usb',
    "type": 'boolean',
    "default": false,
    "description": 'Enable usb (ehci) device emulation (for testing)'
  },
  {
    "name": 'pcspk',
    "type": 'boolean',
    "default": true,
    "description": 'Enable PCSpeaker emulation (if you haven\'t native)'
  },
  {
    "name": 'curses',
    "type": 'boolean',
    "default": false,
    "description": 'Use text-mode graphics'
  },
  {
    "name": 'port',
    "type": 'number',
    "default": 0,
    "description": 'Redirect TCP/UDP connections on the host port to the runtime.js'
  },
  {
    "name": 'append',
    "type": 'string',
    "default": '',
    "description": 'Append string to jsos kernel command line'
  },
  {
    "name": 'dry-run',
    "type": 'boolean',
    "default": false,
    "description": 'Test input but do not launch the VM'
  },
  {
    "name": 'verbose',
    "type": 'boolean',
    "default": false,
    "description": 'Output extra info like VM command line'
  },
  {
    "name": 'virtio-rng',
    "type": 'boolean',
    "default": false,
    "description": 'Enable VIRTIO-RNG entropy source for the runtime.js'
  },
  {
    "name": 'nographic',
    "type": 'boolean',
    "default": false,
    "description": 'Disable graphics, run in command line mode'
  },
  {
    "name": 'kernel',
    "type": 'string',
    "default": '',
    "description": 'Specify custom kernel binary file to use'
  },
  {
    "name": 'append-qemu',
    "type": 'string',
    "default": '',
    "description": 'Append qemu command line arguments'
  },
  {
    "name": 'local',
    "type": 'boolean',
    "default": false,
    "description": 'Download the kernel locally (i.e. in the module\'s directory)'
  },
  {
    "name": 'drive',
    "type": 'string',
    "default": '',
    "description": 'A file to attach as a virtio block device'
  },
  {
    "name": 'hd0',
    "type": 'boolean',
    "default": false,
    "description": 'Mount HD disk image as /hd0/,\ndefaults to "jsos-hd0.img"'
  },
  {
    "name": 'hd0img',
    "type": 'string',
    "default": 'jsos-hd0.img',
    "description": 'Disk image to mount (if --hd0 is enabled),\ndefaults to "jsos-hd0.img"'
  },
];

const mkimgArgs = [
  {
    "name": 'filename',
    "type": 'string',
    "default": 'jsos-hd0.img',
    "description": 'The filename for the newly created disk image including the extension,\ndefaults to "jsos-hd0.img"'
  },
  {
    "name": 'size',
    "type": 'number',
    "default": 32,
    "description": 'The size for the newly created disk image in Megabytes\ndefaults to 32'
  }
];

const mkisoArgs = [
  {
    "name": 'kernel',
    "type": 'string',
    "default": 'kernel',
    "description": 'Path to JsOS kernel if needs to create the folder'
  },
  {
    "name": 'initrd',
    "type": 'string',
    "default": '.initrd',
    "description": 'Path to JsOS initrd build if needs to create the folder'
  }
];

const cmds = [
  {
    "name": 'start',
    "description": 'Quickly start runtime.js VM using current directory',
    "args": runArgs.concat(packArgs)
  }, {
    "name": 'watch',
    "description": 'Watch current directory and automatically restart runtime.js VM',
    "args": runArgs.concat(packArgs)
  }, {
    "name": 'pack',
    "description": 'Package specified directory into ramdisk bundle',
    "args": packArgs,
    "mainArg": {
      "name": 'directory',
      "description": 'Directory to package'
    }
  }, {
    "name": 'run',
    "description": 'Run runtime.js VM using specified ramdisk bundle',
    "args": runArgs,
    "mainArg": {
      "name": 'ramdisk',
      "description": 'Ramdisk/initrd bundle file to use'
    }
  }, {
    "name": 'show',
    "description": 'Print VM output or log',
    "mainArg": {
      "name": 'type',
      "description": 'VM output file to print, can be "log" or "netdump",\ndefaults to "log"'
    }
  }, {
    "name": 'mkimg',
    "description": 'Easily create a disk image for use in JsOS',
    "args": mkimgArgs
  }, {
    "name": 'mkiso',
    "description": 'Build the JsOS ISO file',
    "args": mkisoArgs,
    "mainArg": [
      {
        "name": 'filename',
        "description": 'The filename for the newly created disk image including the extension,\ndefaults to "JsOS.iso"'
      },
      {
        "name": 'folder',
        "type": 'string',
        "default": 'disk',
        "description": 'Forlder of the kernel, initrd and grub config files. \nDefaults to "disk"\nIf folder isn\'t exist, it will be created.'
      }
    ]
  }, {
    "name": 'depack',
    "description": 'Depack the initrd file',
    "args": [],
    "mainArg": {
      "name": 'filename',
      "description": 'The filename for the depack,\ndefaults to ".initrd"'
    }
  }, {
    "name": 'help',
    "description": 'Print this usage help'
  }
];

function help() {
  console.log('USAGE: jsos <command> [<args>]');
  console.log('');
  console.log('Commands:');

  for (const cmd of cmds) {
    console.log(`  ${pad(cmd.name, 14)}${padDescription(cmd.description)}`);
  }
}

function padDescription(t) {
  return String(t).split('\n').join(pad('\n', 17));
}

function commandHelp(command) {
  console.log(`USAGE: jsos ${command.name 
  }${command.args ? ' [<args>]' : '' 
  }${command.mainArg ? (` <${command.mainArg.name}>`) : ''}`);

  console.log(`(${command.description})`);

  if (command.mainArg) {
    const ma = command.mainArg;
    console.log('');
    if (ma instanceof Array) {
      for (const arg of ma) {
        console.log(`  ${pad(`<${arg.name}>`, 14)}${padDescription(arg.description)}`);
      }
    } else {
      console.log(`  ${pad(`<${ma.name}>`, 14)}${padDescription(ma.description)}`);
    }
  }

  if (command.args) {
    console.log('');
    console.log('Arguments:');

    for (let i = 0; i < command.args.length; ++i) {
      const arg = command.args[i];
      console.log(`  --${pad(arg.name, 12)}${padDescription(arg.description)}`);
    }
  }
}

const args = process.argv.slice(2);

if (args.length === 0) {
  help();
  return;
}

const command = args[0];

if (command === 'help' || command === '--help') {
  help();
  return;
}

if (command === '--version') {
  console.log(version);
  return;
}

if (command === 'completion') {
  tabtab.complete('jsos', (err, data) => {
    if (err || !data) {
      return;
    }

    const line = String(data.line || '');
    const parts = line.split(' ');
    if (parts.length > 2) {
      const commandName = parts[1];
      for (let i = 0; i < cmds.length; ++i) {
        const cmd = cmds[i];
        if (cmd.name === commandName && cmd.args && /^--\w?/.test(data.last)) {
          tabtab.log(cmd.args.map((a) => a.name), data, '--');
          return;
        }
      }
    } else {
      tabtab.log(cmds.map((c) => c.name), data);
    }
  });
  return;
}

let commandHandled = false;

for (let i = 0; i < cmds.length; ++i) {
  const cmd = cmds[i];
  if (cmd.name === command) {
    commandHandled = true;

    var argsOpts = {
      "string": [],
      "boolean": ['help'],
      "default": {}
    };

    if (cmd.args) {
      cmd.args.forEach((arg) => {
        if (arg.type === 'boolean') {
          argsOpts.boolean.push(arg.name);
        }

        if (arg.type === 'string') {
          argsOpts.string.push(arg.name);
        }

        argsOpts.default[arg.name] = arg.default;
      });
    }

    const argv = parseArgs(args.slice(1), argsOpts);
    if (argv.help) {
      commandHelp(cmd);
      return;
    }

    const commandFunction = require(`../command/jsos-${cmd.name}`);
    commandFunction(argv, (err) => {
      if (err) {
        if (typeof err === 'string') {
          console.log(chalk.red(`error: ${err}`));
        } else {
          throw err;
        }
        process.exit(1);
      } else {
        console.log(chalk.green('OK!'));
      }
    });

    break;
  }
}

if (commandHandled) {
  return;
}

help();
