DROP TABLE IF EXISTS public.otp;
DROP TABLE IF EXISTS public.users;
CREATE TABLE public.users
(
    id                        SERIAL PRIMARY KEY,
    "name"                    VARCHAR(64)  NOT NULL,
    surname                   VARCHAR(64)  NOT NULL,
    email                     VARCHAR(255) NOT NULL UNIQUE,
    "password"                CHAR(60)     NOT NULL,
    two_factor_authentication BOOL         NOT NULL
);
CREATE TABLE public.otp
(
    id   SERIAL PRIMARY KEY,
    otp  CHAR(60)  NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT NOW()
);
GRANT INSERT, UPDATE, DELETE, SELECT, TRUNCATE ON public.users TO cooking_forum;
GRANT UPDATE, SELECT, USAGE ON SEQUENCE public.users_id_seq TO cooking_forum;
GRANT INSERT, UPDATE, DELETE, SELECT, TRUNCATE ON public.otp TO cooking_forum;
GRANT UPDATE, SELECT, USAGE ON SEQUENCE public.otp_id_seq TO cooking_forum;
