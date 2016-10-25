import 'reflect-metadata';
import test from 'ava';

import { command, option } from '../dist';

// https://github.com/avajs/ava/issues/1089
const g = <any>global;
const Reflect = g.Reflect;

test((t) => {
  debugger;
  class MyCommand {
    @command({ argv: ['--test', 'test-value'] })
    run(@option({ name: 'test' }) test: string) {
      t.true(test === 'test-value');
    }
  }

  let c = new MyCommand();
  c.run('');
});
