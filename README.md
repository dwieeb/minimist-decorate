# minimist decorators

Use ES7 decorators to declare CLI input in a clean, type-safe fashion. Parses
command line arguments and options using James Halliday's
[minimist](https://github.com/substack/minimist).

## installation

* node 6+
* install [`reflect-metadata`](https://github.com/rbuckton/ReflectDecorators)
  (`npm install --save reflect-metadata`)

## usage

Import the decorators. `@command()` must decorate a method. `@argument` and
`@option` must decorate method parameters. When your `@command` method is
called, the decorator parses CLI input at runtime and forwards values onto your
method using reflection.

```typescript
import { argument, command, option } from 'minimist-decorators';

class MyCommand {
  @command()
  run(
    @argument({ name: 'first-name' }) firstName: string,
    @option({ name: 'happy' }) happy: boolean,
    @option({ name: 'age', default: 26 }) age: number
  ) {
    console.log(`Hi, ${firstName}! You are ${age} years old.`);

    if (happy) {
      console.log('Oh, happy day!');
    }
  }
}

const cmd = new MyCommand();
cmd.run();
```

### differences to minimist

* Your `@command` declares a whitelist of arguments and inputs. minimist passes
  on all it can.
* Type safety is important. CLI input is validated to ensure your `@command` is
  called with the right types. Because this happens at run-time with
  reflection, exceptions may be thrown. minimist has no such validation step.

### caveats

* ES7 decorators cannot be used on traditional function declarations because of
  function hoisting. See
  [Microsoft/TypeScript#2249](https://github.com/Microsoft/TypeScript/issues/2249)
  for more information.
* Union types (such as `number | undefined`) are clobbered at runtime. If an
  `@option` isn't given, the "zero value" of the option's respective type is
  supplied (and can be changed by using `default`).

| type      | zero value
|-----------|------------
| `string`  | `''` (empty string)
| `number`  | `0`
| `boolean` | `false`

### license

MIT, just like minimist
