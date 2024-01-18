import test from "ava";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitError, DrupalkitOptions } from "@drupal-kit/core";

import {
  DrupalkitSimpleOauth,
  DrupalkitSimpleOauthError,
} from "../src/index.js";
import ErrorResponse from "./fixtures/error_response.json" with { type: "json" };
import TokenResponse from "./fixtures/token_response.json" with { type: "json" };
import UserInfoResponse from "./fixtures/userinfo_response.json" with { type: "json" };

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
    http.post("*/oauth/token", async ({ request }) => {
      const body = await request.text();

      t.is(
        request.headers.get("content-type"),
        "application/x-www-form-urlencoded",
      );
      t.snapshot(body);

      return HttpResponse.json(TokenResponse);
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

test.serial("Request token with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/oauth/token", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(TokenResponse)
    }),
  );

  await drupalkit.simpleOauth.requestToken(
    "client_credentials",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
    {
      cache: "no-cache",
      headers: {
        "X-Custom": "1",
      },
    },
  );
});

test.serial("Request token with explicit endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    oauthTokenEndpoint: "/custom/token",
  });

  server.use(
    http.post("*/custom/token", async () => HttpResponse.json(TokenResponse)),
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
    http.post("*/oauth/token", async () =>
      HttpResponse.json(ErrorResponse, { status: 400 }),
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
    http.post("*/oauth/token", async () =>
      HttpResponse.error()
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
      http.post("*/not/oauth/related", async () => HttpResponse.text(null, { status: 400 })),
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
    http.get("*/oauth/userinfo", async () => HttpResponse.json(UserInfoResponse)),
  );

  const result = await drupalkit.simpleOauth.getUserInfo();

  const res = result.unwrap();

  t.snapshot(res);
});

test.serial("Request user info with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.get("*/oauth/userinfo", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(UserInfoResponse);
    }),
  );

  await drupalkit.simpleOauth.getUserInfo({
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Request user info with explicit endpoint", async (t) => {
  const endpoint = "/custom/userinfo";

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    oauthUserInfoEndpoint: endpoint,
  });

  server.use(
    http.get("*/custom/userinfo", async () =>
      HttpResponse.json(UserInfoResponse),
    ),
  );

  const result = await drupalkit.simpleOauth.getUserInfo();

  t.assert(result.ok);
});

test.serial("Handle request errors when requesting user info", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/oauth/userinfo", async () =>
      HttpResponse.json(ErrorResponse, { status: 400 }),
    ),
  );

  const result = await drupalkit.simpleOauth.getUserInfo();

  const error = result.expectErr("Expected error");

  t.assert(!(error instanceof DrupalkitSimpleOauthError));
  t.assert(error instanceof DrupalkitError);
  t.is(error.statusCode, 400);
});
