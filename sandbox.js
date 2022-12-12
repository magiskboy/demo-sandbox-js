const { Console } = require("console");
const stream = require("stream");

const sandboxProxies = new WeakMap();

function compileCode(src) {
  src = 'with (sandbox) {' + src + '}';
  const code = new Function('sandbox', src);

  return function(sandbox) {
    if (!sandboxProxies.has(sandbox)) {
      const sandboxProxy = new Proxy(sandbox, { has, get });
      sandboxProxies.set(sandbox, sandboxProxy);
    };
    return code(sandboxProxies.get(sandbox));
  }
}

function has(target, key) {
  return true;
}

function get(target, key) {
  if (key === Symbol.unscopables) return undefined;
  return target[key];
}

function makeStandardSandbox() {
  const stdout = new stream.Duplex();
  const stderr = new stream.Duplex();
  const stdin = new stream.Duplex();

  return {
    globalThis: {
      process: {
        stderr,
        stdout,
        stdin,
      },
      console: new Console(stdout, stderr),
    }
  }
}

function runCode(src) {
  try {

    const executor = compileCode(src);
    const sandbox = makeStandardSandbox();
    const output = [];
    sandbox.globalThis.process.stdout._write = function(chunk, encoding, callback) {
      output.push(chunk.toString());
      if (callback) {
        callback();
      }
    }
    executor(sandbox);
    return output.join('');
  }
  catch (e) {
    console.error(e);
  }
  return '';
}

module.exports = {
  compileCode,
  makeStandardSandbox,
  runCode,
};
