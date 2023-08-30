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

The `util` directory contains some utility classes that are used to ease the tests.
