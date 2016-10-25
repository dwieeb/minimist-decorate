import * as minimist from "minimist";

if (!Reflect || !Reflect.decorate) {
  try {
    require('reflect-metadata');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      throw new Error("Metadata Reflection API and 'reflect-metadata' polyfill were not found. Run 'npm install --save reflect-metadata'.");
    }

    throw e;
  }
}

export type ParameterType = StringConstructor | NumberConstructor | BooleanConstructor;

export interface CommandSchema {
  argv?: string[];
}

export interface OptionSchema {
  name: string;
  type?: ParameterType;
  default?: any;
  aliases?: string[];
}

interface ParameterMetadata {
  position: number;
  type: ParameterType;
  option: OptionSchema;
}

const optionSymbol = Symbol("option");

function compileMinimistOpts(parameterMetadata: ParameterMetadata[]): minimist.Opts {
  const strings: string[] = [];
  const booleans: string[] = [];
  const defaults: { [key: string]: any } = {};

  for (let metadata of parameterMetadata) {
    if (metadata.type === String) {
      strings.push(metadata.option.name);

      if (!metadata.option.default) {
        metadata.option.default = '';
      }
    } else if (metadata.type === Boolean) {
      booleans.push(metadata.option.name);
    } else if (metadata.type === Number) {
      if (!metadata.option.default) {
        metadata.option.default = 0;
      }
    }

    defaults[metadata.option.name] = metadata.option.default;
  }

  return {
    string: strings,
    boolean: booleans,
    default: defaults
  };
}

export function command(schema: CommandSchema = {}) {
  return function(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Function>) {
    const method = descriptor.value;

    if (!method) {
      throw new TypeError(`'${propertyKey}' is undefined - cannot apply reflection metadata.`);
    }

    descriptor.value = function() {
      if (!method) {
        throw new TypeError(`'${propertyKey}' is undefined - cannot apply reflection metadata.`);
      }

      const parameterMetadata: ParameterMetadata[] = Reflect.getOwnMetadata(optionSymbol, target, propertyKey) || [];
      const args = Array.prototype.slice.call(arguments);

      const opts = compileMinimistOpts(parameterMetadata);
      const argv = schema.argv !== undefined ? schema.argv : process.argv;
      const parsedArgs = minimist(argv, opts);

      for (let metadata of parameterMetadata) {
        if (metadata.type !== String && metadata.type !== Number && metadata.type !== Boolean) {
          throw new TypeError(`Parameter ${metadata.position} is not a valid type (must be 'String', 'Number', or 'Boolean').`);
        }

        const value = parsedArgs[metadata.option.name];

        if (metadata.type === String && typeof value !== 'string') {
          throw new TypeError(`Parameter ${metadata.position} (type 'String') is not a string.`);
        }

        if (metadata.type === Number && typeof value !== 'number') {
          throw new TypeError(`Parameter ${metadata.position} (type 'Number') is not a number.`);
        }

        if (metadata.type === Boolean && typeof value !== 'boolean') {
          throw new TypeError(`Parameter ${metadata.position} (type 'Boolean') is not a boolean.`);
        }

        args[metadata.position] = value;
      }

      method.apply(this, args);
    };
  }
}

export function option(schema: OptionSchema) {
  return function(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    const parameterMetadata: ParameterMetadata[] = Reflect.getOwnMetadata(optionSymbol, target, propertyKey) || [];
    const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
    let type: ParameterType = String;

    if (paramTypes && paramTypes[parameterIndex] !== undefined) {
      type = paramTypes[parameterIndex];
    } else if (schema && schema.type) {
      type = schema.type;
    } else {
      throw new TypeError(`Parameter ${parameterIndex} has no type information. For TypeScript, enable 'emitDecoratorMetadata' compiler option. For JavaScript, specify 'type' in schema.`);
    }

    parameterMetadata.push({ position: parameterIndex, type: type, option: schema });
    Reflect.defineMetadata(optionSymbol, parameterMetadata, target, propertyKey);
  }
}
