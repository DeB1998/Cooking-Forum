# Cooking forum tests

This directory contains some automated tests. In particular:

- The `user-login.spec.ts` file contains the automated tests testing the user login process without
  the two-factor authentication enabled;
- The `user-login-2fa.spec.ts` file contains the automated tests testing the user login process with
  the two-factor authentication enabled;
- The `user-login-error.spec.ts` file contains the automated tests testing the user login process in
  case the provided credentials are not correct, regardless the user has enabled or not the
  two-factor authentication;
- The `user-registration.spec.ts` file contains the automated tests testing the user registration
  process.

The `utils` directory contains some utility classes that are used to ease the tests.

## How to run the tests

The tests need to be run with Mocha, which is automatically installed as a development dependency if
you run `npm install`.

Moreover, the tests are self-contained, meaning that, when the first test
starts, the framework will take care of creating an HTTP server running the application and
listening for incoming requests on a random port.
The HTTP server will be shut down when the last test terminates.

To run the tests contained in one of the test files, move to the directory where you cloned or
extracted this repository and run the following command:

```shell
TS_NODE_PROJECT=./tsconfig.spec.json; node --require ts-node/register "./node_modules/mocha/bin/mocha.js" "<file-to-test.ts>"
``` 

Note that, since tests are written in TypeScript, Node.js requires `ts-node` to correctly compile
and run them. Moreover, the `TS_NODE_PROJECT` environment variable specifies the path to
the `tsconfig.spec.json` file that contains the TypeScript transpiler configurations.

Additional environment variables can be specified to override the configurations specified in
the `.env` file, as explained in the [README.md](../README.md#environment-variables) file.
