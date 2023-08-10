
* You may need kill watchman precess if it runs in background otherwise test will no be run.

* xxx

```
$ yarn config set watchman false
```

```
$ yarn config list
```

```
$ cat ~/.yarnrc
```

## Run tests

Single test module:
```
$ yarn test ./packages/matrixnorm/__tests__/useState-test.js
```

Single test from module:
```
$ yarn test ./packages/matrixnorm/__tests__/useState-test.js -t mount
```

## Run test with debugger

1. Create `launch.json` in `.vscode` folder:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Node process",
      "skipFiles": [
        "<node_internals>/**"
      ],
      "processId": "${command:PickProcess}"
    }
  ]
}
```

2. Run tests with `--inspect --inspect-brk` flags:

```
$ NODE_ENV=development RELEASE_CHANNEL=experimental compactConsole=false node --inspect=127.0.0.1:9230 --inspect-brk ./scripts/jest/jest.js --config ./scripts/jest/config.source.js ./packages/matrixnorm/__tests__/useState-test.js -t mount
Debugger listening on ws://127.0.0.1:9230/78898667-51b4-4263-a9b8-a1b8ca7da6e7
```

3. Start debugging and select correct process to attach to.