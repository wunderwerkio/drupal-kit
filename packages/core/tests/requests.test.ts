import test from "ava";

import { Drupalkit, DrupalkitError } from "../src/index.js";
import DemoEndpointResponse from "./fixtures/demo-endpoint.json" assert { type: "json" };

import { rest } from 'msw'
import { setupServer } from 'msw/node'

const BASE_URL = "https://my-drupal.com";

const server = setupServer(
  rest.get('*/demo-endpoint', (_req, res, ctx) => {
    return res(
      ctx.json(DemoEndpointResponse)
    )
  }),
  rest.get("*/not-found", (_req, res, ctx) => res(ctx.status(404))),
  rest.get("*/network-error", (_req, res) => res.networkError('Failed to connect')),
);

test.before(() => {
  server.listen();
})

test.afterEach(() => {
  server.resetHandlers();
})

test.after(() => {
  server.close();
})

test.serial("Make simple GET request", async (t) => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "GET",
    headers: {},
  });

  t.assert(result.ok);

  const response = result.unwrap();

  t.is(response.status, 200);
  t.assert(response.url.includes("/demo-endpoint"));
  t.assert(response.url.startsWith(BASE_URL));
  t.deepEqual(response.data, DemoEndpointResponse);
  t.assert("content-type" in response.headers);
});

test.serial("Make request with payload", async (t) => {
  t.plan(3);

  const headers = {
    "X-Custom": "value",
  };
  const body = {
    hello: "world",
  };

  server.use(
    rest.post('*/demo-endpoint', async (req, res, ctx) => {
      const payload = await req.json();
      t.deepEqual(payload, body);
      t.deepEqual(req.headers.get("X-Custom"), headers["X-Custom"]);

      return res()
    })
  )

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "POST",
    headers,
    body,
  });

  t.assert(result.ok);
})

test.serial("Add response data to result", async t => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "GET",
  });

  t.deepEqual(result.unwrap().headers, {
    'content-type': 'application/json',
    'x-powered-by': 'msw'
  });
})

test.serial("Do not add response data for 204 and 205 responses", async t => {
  server.use(
    rest.get('*/demo-endpoint-204', async (req, res, ctx) => {
      return res(ctx.status(204));
    })
  )

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint-204", {
    method: "GET",
  });

  t.is(result.unwrap().data, undefined);
})

test.serial("Return drupalkit errors", async (t) => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/not-found", {
    method: "GET",
    headers: {},
  });

  t.assert(result.err);

  const err = result.expectErr('Must be error');

  t.assert(err instanceof DrupalkitError);
  t.is(err.statusCode, 404);
})

test.serial('Append locale to url', async (t) => {
  rest.get('*/en/demo-endpoint', (req, res, ctx) => {
    return res(
      ctx.json(DemoEndpointResponse)
    )
  });

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
    locale: "en",
    defaultLocale: "de",
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "GET",
    headers: {},
  });

  const response = result.unwrap();

  t.assert(response.url.includes("/en/demo-endpoint"));
})

test.serial('Append overwritten locale to url', async (t) => {
  rest.get('*/en/demo-endpoint', (req, res, ctx) => {
    return res(
      ctx.json(DemoEndpointResponse)
    )
  });

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
    defaultLocale: "de",
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "GET",
    headers: {},
    locale: "en",
  });

  const response = result.unwrap();

  t.assert(response.url.includes("/en/demo-endpoint"));
})

test.serial("Execute hooks", async t => {
  t.plan(5)

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  drupalkit.hook.before("request", (options) => {
    t.is(options.baseUrl, BASE_URL);
  });

  drupalkit.hook.after("request", (result, options) => {
    t.is(options.baseUrl, BASE_URL);

    t.is(result.status, 200)
    t.deepEqual(result.data, DemoEndpointResponse)
    t.is(result.headers["content-type"], "application/json")
  });

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
    headers: {},
  });
})

test.serial("Add auth header if present", async t => {
  t.plan(2)
  const authHeaderValue = "Bearer 00000";

  server.use(
    rest.get("*/demo-endpoint", (req, res) => {
      t.is(req.headers.get("authorization"), authHeaderValue);

      res.once();
    }),
  )

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  drupalkit.setAuth(authHeaderValue);

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
  });

  // With explicit unauthenticated.

  server.resetHandlers();
  server.use(
    rest.get("*/demo-endpoint", (req, res) => {
      t.is(req.headers.get("authorization"), null);

      res.once();
    })
  )

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
    unauthenticated: true,
  });
})

test.serial("Handle network errors", async t => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/network-error", {
    method: "GET",
  });

  t.assert(result.err);
  const error = result.expectErr("Must be error");

  t.assert(error instanceof DrupalkitError);
  t.is(error.response, undefined);
})
