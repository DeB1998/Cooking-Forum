# Cooking forum

This repository contains the back-end part of a web application that allows the user to register and
log into a web application managing a forum on cooking.

## Build the application

The back-end can be run on any Node.js environment.

### Prerequisites

To build the application, we assume:

- A working Node.js enviroment;
- A working PostgreSQL database

### How to build

To correctly build the application, follow these steps:

1. Move to the directory where you cloned or extracted this repository;
2. Run `npm install` to install all the required dependencies;
3. Run `npm run compile-sources` to compile the source code. The compiled code will be placed inside
   the `build` directory, which will be created in the directory where you cloned or extracted this
   repository;
4. Prepare the database by:
    1. Creating a new database, e.g., `cooking-forum`;
    2. Creating a new user, e.g., `cooking-forum`,;
    3. Run the SQL code you can find in the `init-database.sql` file, taking care of replacing, in
       the last four lines, the strings `cooking-forum` with the name of the user you have created
       in the previous step.

Now, you can run the application, as explained in the following section.

## Run the application

Once you have built the application, you can run it by moving to the directory where you cloned or
extracted this repository and executing the command:

```shell
node "./build/src/main"
```

where `./build/src/main` is the path to the compiled JavaScript main file.

By default, the application will load the configuration from the `.env` file you can find the
directory where you cloned or extracted this repository.

Any of these configurations can be changed by either modifying the `.env` file or by specifying them
as enviroment variables before executing the `node` command.
For instance, if you want to set to `9000` the HTTP server port and set to `my-database` the name of
the database the application will connect to, you can execute:

```shell
PORT=9000; DATABASE_NAME=my-database; node "./build/src/main"
```

Note that the environment variables specified on the command line will take precedence over the ones
specified in the `.env` file.

### Environment variables

This section explains the meaning of each configuration that can be set in the `.env` file or
overriden by an environment variable.

#### `DEBUG`

Set this to `true` to run the application should be run in debug mode, so to print all the debug
logs. If not specified, it defaults to `false`.

#### `SERVER_PORT`

Port where the application will listen to incoming requests. This variable is mandatory.

#### `DATABASE_HOST`

Host where the database is executed on. If not specified, it defaults to `localhost`.

#### `DATABASE_PORT`

Port on the `DATABASE_HOST` where PostgreSQL listens to incoming requests. If not specified, it
defaults to `5432`.

#### `DATABASE_USER`

Name of the user that will execute the queries on the PostgreSQL database. If not specified, the
default PostgreSQL user will be used.

#### `DATABASE_PASSWORD`

Password of the user that will execute the queries on the PostgreSQL database. If not specified, the
empty password will be used.

#### `DATABASE_NAME`

Name of the database the application will operate on. This variable is mandatory.

#### `PASSWORD_SALT_ROUNDS`

Number of iterations performed by the algorithm that generates the passwords of the users and the
OTPs. The higher the value, the stronger the salt at cost of more computations. This variable is
mandatory.

#### `JWT_SECRET`

Secret key that will be used to sign and verify JWT session tokens. This variable is
mandatory.

#### `SESSION_DURATION`

Number of seconds after which a JWT session token will expire. This variable is
mandatory.

#### OTP_DURATION

Number of seconds after which a JWT session token will expire. This variable is
mandatory.

## Endpoints

The application exposes 3 endpoints, detailed in the following sections:

| URL        | HTTP method |
|------------|-------------|
| `/users`   | `POST`      |
| `/jwt`     | `GET`       |
| `/2fa/jwt` | `GET`       |

Any other endpoint and/or HTTP method will cause the server to generate an HTTP response with
status 404.

### `/users`

Call this endpoint to register a new user.

#### Request

The request must contain a JSON object with the following form:

```json
{
    "name": "...",
    "surname": "...",
    "email": "...",
    "password": "...",
    "twoFactorAuthentication": "..."
}
```

where:

- `name` is the name of the user. It must be a string 1 to 32 characters-long;
- `surname` is the surname of the user. It must be a string 1 to 32 characters-long;
- `email` is the e-mail address of the user that they will provide at login time. The application
  will check that the specified email is a valid e-mail address;
- `password` is the password. It must be a string 1 to 32 characters-long, and it must contain at
  least:
    - An uppercase letter;
    - A lowercase letter;
    - A digit;
    - One of the symbols `@`, `$`, `!`, `%`, `*`, `?`, `&`, `-`, `_`.
- `twoFactorAuthentication` is a boolean flag indicating whether the user wants to enable (`true`)
  or not (`false`) the two-factor authentication.

#### Response

##### Success

In case the user is successfully registered, the server will send an HTTP response with status 200
and containing in the body the following JSON object:

```json
{
    "error": false,
    "created": true
}
```

##### Error

In case:

- The user is already registered;
- The values (`name`, `surname`, etc.) specified in the request does not satisfy the constraints
  explained in the previous section;
- The JSON object does not conform to the structure explained in the previous section.

the server will send an HTTP response with status 400 and the following JSON object in the body:

```json
{
    "error": true,
    "message": "..."
}
```

where `message` is a string explaining the reason of the error.

### `/jwt`

This endpoint must be called to start the login process. If the login is successful, the server
generates a JWT token holding the user's session data.

If the user has enabled the two-factor authentication, then the client must then call the `/2fa/jwt`
endpoint to perform the second step of the authentication.

If, instead, the user has not enabled the two-factor authentication, then the login
process is terminated.

#### Request

The credentials are specified in the HTTP request according to the _basic authentication_ standard,
i.e., the e-mail and password are concatenated using a colon (`:`) as separator, and the resulting
string is prepended with the string `Basic ` and then placed in the `Authentication` header of the
request.

#### Response

##### Success

In case the provided e-mail and password are correct, the server sends an HTTP response with status
200, and the following JSON object in its body:

```json
{
    "error": false,
    "jwt": "...",
    "requiresTwoFactorAuthentication": "..."
}

```

where:

- `jwt` is the JWT token containing the user's session;
- `requiresTwoFactorAuthentication` is a boolean flag stating whether the second step of the
  two-factor authentication is required to authenticate the user.

The JWT token contains the ID that uniquely identifies the user and, if the two-factor
authentication is enabled, the ID of the row in the database table containing the generated OTPs.

#### Error

In case:

- The provided email and password are not correct;
- The value in the `Authentication` header is malformed;
- No `Authentication` header is provided

the server will send back an HTTP response with status 403 and the following JSON object in the
body:

```json
{
    "error": true,
    "message": "..."
}
```

where `message` is a string explaining the reason of the error.

### `/2fa/jwt`

This endpoint must be called after the `/jwt` one has benn called.

In case the user enabled the two-factor authentication, the generated OTP is printed

#### Request

The HTTP request must contain, in its body, a JSON object conforming to the following format:

```json
{
    "otp": "..."
}
```

where `otp` is the OTP the user inserts to complete the second step of the two-factor
authentication.

The client must also supply the JWT session token in the `Authentication` header,
specifying `Bearer` as authentication type.

#### Response

##### Success

In case the provided OTP matches the generated one, the server will generate and HTTP response with
status 200 and containing the following JSON object in its body:
In case the provided e-mail and password are correct, the server sends an HTTP response with status
200, and the following JSON object in its body:

```json
{
    "error": false,
    "jwt": "...",
    "requiresTwoFactorAuthentication": false
}

```

where:

- `jwt` is the JWT token containing the user's session. In particular, it contains the ID that
  uniquely identifies the user.

##### Error

In case:

- The OTP is expired, does not match the generated one, is malformed or is missing;
- The JWT session token is missing or malformed

the server will generate an HTTP response with status 403 and the following JSON object in the
body:

```json
{
    "error": true,
    "message": "..."
}
```

where `message` is a string explaining the reason of the error.
