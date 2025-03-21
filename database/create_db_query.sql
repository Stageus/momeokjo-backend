CREATE TABLE users.codes
(
  idx         serial       PRIMARY KEY,
  email       varchar(254) NOT NULL,
  code       varchar(6)   NOT NULL,
  created_at timestamp    NOT NULL DEFAULT current_timestamp
);

create type role_enum as enum ('ADMIN', 'USER');

CREATE TABLE users.lists
(
  idx        serial       PRIMARY KEY,
  id         varchar(50)  NOT NULL UNIQUE,
  pw         varchar(32)  NOT NULL,
  role       role_enum    NOT NULL,
  email      varchar(254) NOT NULL UNIQUE,
  nickname   varchar(50)  NOT NULL UNIQUE,
  is_deleted boolean      NOT NULL DEFAULT false,
  created_at timestamp    NOT NULL DEFAULT current_timestamp,
  updated_at timestamp    NOT NULL DEFAULT current_timestamp
);

CREATE TABLE users.oauth
(
  idx              serial     PRIMARY KEY,
  users_idx        bigint      REFERENCES users.lists(idx),
  provider         varchar(50) NOT NULL,
  provider_user_id text        NOT NULL,
  refresh_token    text        NOT NULL,
  is_deleted      boolean     NOT NULL DEFAULT false,
  created_at       timestamp   NOT NULL DEFAULT current_timestamp,
  updated_at       timestamp   NOT NULL DEFAULT current_timestamp
);

CREATE TABLE users.reports
(
  idx          serial    PRIMARY KEY,
  reporter_idx bigint    REFERENCES users.lists(idx),
  reported_idx bigint    REFERENCES users.lists(idx),
  created_at   timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE restaurants.categories
(
  idx         serial      PRIMARY KEY,
  users_idx   bigint      REFERENCES users.lists(idx),
  name        varchar(10) NOT NULL,
  is_deleted boolean     NOT NULL DEFAULT false,
  created_at  timestamp   NOT NULL DEFAULT current_timestamp,
  updated_at  timestamp   NOT NULL DEFAULT current_timestamp
);

CREATE TABLE restaurants.lists
(
  idx             serial                 PRIMARY KEY,
  categories_idx  bigint                 REFERENCES restaurants.categories(idx),
  users_idx       bigint                 REFERENCES users.lists(idx),
  name            varchar(50)            NOT NULL,
  latitude       double precision       NOT NULL,
  longitude       double precision       NOT NULL,
  location        geography(point, 4326) NOT NULL,
  address        varchar(100)           NOT NULL,
  address_detail varchar(100)          ,
  phone          varchar(11)           ,
  start_time     varchar(4)            ,
  end_time       varchar(4)            ,
  is_deleted     boolean                NOT NULL DEFAULT false,
  created_at     timestamp              NOT NULL DEFAULT current_timestamp,
  updated_at      timestamp              NOT NULL DEFAULT current_timestamp
);

CREATE TABLE restaurants.likes
(
  idx             serial    PRIMARY KEY,
  restaurants_idx bigint    REFERENCES restaurants.lists(idx),
  users_idx       bigint    REFERENCES users.lists(idx),
  is_deleted      boolean   NOT NULL DEFAULT false,
  created_at     timestamp NOT NULL DEFAULT current_timestamp,
  updated_at      timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE restaurants.reports
(
  idx            serial    PRIMARY KEY,
  restaurants_idx bigint    REFERENCES restaurants.lists(idx),
  users_idx       bigint    REFERENCES users.lists(idx),
  created_at      timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE menus.lists
(
  idx             serial      PRIMARY KEY,
  restaurants_idx bigint      REFERENCES restaurants.lists(idx),
  users_idx       bigint      REFERENCES users.lists(idx),
  name            varchar(20) NOT NULL,
  price          varchar(10) NOT NULL,
  is_deleted      boolean     NOT NULL DEFAULT false,
  created_at     timestamp   NOT NULL DEFAULT current_timestamp,
  updated_at      timestamp   NOT NULL DEFAULT current_timestamp
);

CREATE TABLE menus.likes
(
  idx       serial    PRIMARY KEY,
  menus_idx  bigint    REFERENCES menus.lists(idx),
  users_idx  bigint    REFERENCES users.lists(idx),
  is_deleted boolean   NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT current_timestamp,
  updated_at timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE menus.reports
(
  idx       serial    PRIMARY KEY,
  menus_idx  bigint    REFERENCES menus.lists(idx),
  users_idx  bigint    REFERENCES users.lists(idx),
  created_at timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE reviews.lists
(
  idx        serial      PRIMARY KEY,
  menus_idx   bigint       REFERENCES menus.lists(idx),
  users_idx   bigint       REFERENCES users.lists(idx),
  content     text         NOT NULL,
  image_url   varchar(255),
  is_deleted  boolean      NOT NULL DEFAULT false,
  created_at timestamp    NOT NULL DEFAULT current_timestamp,
  updated_at  timestamp    NOT NULL DEFAULT current_timestamp
);

CREATE TABLE reviews.likes
(
  idx         serial    PRIMARY KEY,
  reviews_idx bigint    REFERENCES reviews.lists(idx),
  users_idx   bigint    REFERENCES users.lists(idx),
  is_deleted  boolean   NOT NULL DEFAULT false,
  created_at  timestamp NOT NULL DEFAULT current_timestamp,
  updated_at timestamp NOT NULL DEFAULT current_timestamp
);

CREATE TABLE reviews.reports
(
  idx       serial    PRIMARY KEY,
  reviews_idx bigint    REFERENCES reviews.lists(idx),
  users_idx  bigint    REFERENCES users.lists(idx),
  created_at timestamp NOT NULL DEFAULT current_timestamp
);

