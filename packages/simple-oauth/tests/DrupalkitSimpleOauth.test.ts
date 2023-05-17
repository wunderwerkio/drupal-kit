import test from "ava";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitError, DrupalkitOptions } from "@drupal-kit/core";

import {
  DrupalkitSimpleOauth,
  DrupalkitSimpleOauthError,
} from "../src/index.js";
import ErrorResponse from "./fixtures/error_response.json" assert { type: "json" };
import TokenResponse from "./fixtures/token_response.json" assert { type: "json" };
import UserInfoResponse from "./fixtures/userinfo_response.json" assert { type: "json" };

const BASE_URL = "https://my-drupal.com";

const CLIENT_ID = "12345678901234567890123456789012";
const CLIENT_SECRET = "F9w1cM0GQw7GjjQUaZcscWHtxnMOvn4d";

const createDrupalkit = (
  options: DrupalkitOptions = {
    baseUrl: BASE_URL,
  },
) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitSimpleOauth);

  return new EnhancedDrupalkit({
    locale: "de",
    defaultLocale: "de",
    ...options,
  });
};

const server = setupServer();

test.before(() => {
  server.listen();
});

test.afterEach(() => {
  server.resetHandlers();
});

test.after(() => {
  server.close();
});

test("Instanciate with plugin", (t) => {
  const drupalkit = createDrupalkit();

  t.assert(drupalkit.hasOwnProperty("simpleOauth"));
});

test.serial("Request token with client credentials grant", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();

  server.use(
    rest.post("*/oauth/token", async (req, res, ctx) => {
      const body = await req.text();

      t.is(
        req.headers.get("content-type"),
        "application/x-www-form-urlencoded",
      );
      t.snapshot(body);

      return res(ctx.json(TokenResponse));
    }),
  );

  const result = await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
  );

  const res = result.unwrap();

  t.snapshot(res);
});

test.serial("Request token with explicit endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    oauthTokenEndpoint: "/custom/token",
  });

  server.use(
    rest.post("*/custom/token", async (_req, res, ctx) =>
      res(ctx.json(TokenResponse)),
    ),
  );

  const result = await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
  );

  t.assert(result.ok);
});

test.serial("Handle request errors", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.post("*/oauth/token", async (_req, res, ctx) =>
      res(ctx.status(400), ctx.json(ErrorResponse)),
    ),
  );

  const result = await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
  );

  const res = result.expectErr("Expected error");

  t.assert(res instanceof DrupalkitSimpleOauthError);
  t.is(res.statusCode, 400);
});

test.serial("Handle network errors", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.post("*/oauth/token", async (_req, res) =>
      res.networkError("Network Error"),
    ),
  );

  const result = await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
  );

  const error = result.expectErr("Expected error");
  t.assert(error.message.includes("Failed to fetch"));
});

test.serial(
  "Do not produce DrupalkitSimpleOauthErrors when not requesting a token",
  async (t) => {
    const drupalkit = createDrupalkit();

    server.use(
      rest.post("*/not/oauth/related", async (_req, res, ctx) =>
        res(ctx.status(400)),
      ),
    );

    const result = await drupalkit.request("/not/oauth/related", {
      method: "POST",
    });

    const error = result.expectErr("Expected error");

    t.assert(!(error instanceof DrupalkitSimpleOauthError));
  },
);

test.serial("Request user info", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.get("*/oauth/userinfo", async (_req, res, ctx) =>
      res(ctx.json(UserInfoResponse)),
    ),
  );

  const result = await drupalkit.simpleOauth.getUserInfo();

  const res = result.unwrap();

  t.snapshot(res);
});

test.serial("Request user info with explicit endpoint", async (t) => {
  const endpoint = "/custom/userinfo";

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    oauthUserInfoEndpoint: endpoint,
  });

  server.use(
    rest.get("*/custom/userinfo", async (_req, res, ctx) =>
      res(ctx.json(UserInfoResponse)),
    ),
  );

  const result = await drupalkit.simpleOauth.getUserInfo();

  t.assert(result.ok);
});

test.serial("Handle request errors when requesting user info", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.get("*/oauth/userinfo", async (_req, res, ctx) =>
      res(ctx.status(400), ctx.json(ErrorResponse)),
    ),
  );

  const result = await drupalkit.simpleOauth.getUserInfo();

  const error = result.expectErr("Expected error");

  t.assert(!(error instanceof DrupalkitSimpleOauthError));
  t.assert(error instanceof DrupalkitError);
  t.is(error.statusCode, 400);
});
