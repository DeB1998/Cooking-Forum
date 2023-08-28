DROP TABLE IF EXISTS public.users;
CREATE TABLE public.users
(
    id       SERIAL,
    name     VARCHAR(64)  NOT NULL,
    surname  VARCHAR(64)  NOT NULL,
    email    VARCHAR(255) NOT NULL,
    password CHAR(255)    NOT NULL /* TODO: Check length*/
);
