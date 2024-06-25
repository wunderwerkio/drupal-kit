import test from "ava";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { Drupalkit, DrupalkitError } from "../src/index.js";
import DemoEndpointResponse from "./fixtures/demo-endpoint.json" with { type: "json" };

const BASE_URL = "https://my-drupal.com";

const server = setupServer(
  http.get("*/demo-endpoint", () => {
    return HttpResponse.json(DemoEndpointResponse);
  }),
  http.get("*/not-found", () => HttpResponse.text("", { status: 404 })),
  http.get("*/network-error", () => HttpResponse.error()),
);

test.before(() => {
  server.listen();
});

test.afterEach(() => {
  server.resetHandlers();
});

test.after(() => {
  server.close();
});

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
    http.post("*/demo-endpoint", async ({ request }) => {
      const payload = await request.json();
      t.deepEqual(payload, body);
      t.deepEqual(request.headers.get("X-Custom"), headers["X-Custom"]);

      return HttpResponse.text();
    }),
  );

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "POST",
    headers,
    body,
  });

  t.assert(result.ok);
});

test.serial("Add response data to result", async (t) => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint", {
    method: "GET",
  });

  const { headers } = result.unwrap();

  t.is(headers["content-type"], "application/json");
});

test.serial("Do not add response data for 204 and 205 responses", async (t) => {
  server.use(
    http.get("*/demo-endpoint-204", async () => {
      return HttpResponse.text(null, { status: 204 });
    }),
  );

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/demo-endpoint-204", {
    method: "GET",
  });

  t.is(result.unwrap().data, undefined);
});

test.serial("Return drupalkit errors", async (t) => {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request("/not-found", {
    method: "GET",
    headers: {},
  });

  t.assert(result.err);

  const err = result.expectErr("Must be error");

  t.assert(err instanceof DrupalkitError);
  t.is(err.statusCode, 404);
});

test.serial("Append locale to url", async (t) => {
  http.get("*/en/demo-endpoint", () => {
    return HttpResponse.json(DemoEndpointResponse);
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
});

test.serial("Append overwritten locale to url", async (t) => {
  http.get("*/en/demo-endpoint", () => {
    return HttpResponse.json(DemoEndpointResponse);
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
});

test.serial("Execute hooks", async (t) => {
  t.plan(5);

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  drupalkit.hook.before("request", (options) => {
    t.is(options.baseUrl, BASE_URL);
  });

  drupalkit.hook.after("request", (result, options) => {
    t.is(options.baseUrl, BASE_URL);

    t.is(result.status, 200);
    t.deepEqual(result.data, DemoEndpointResponse);
    t.is(result.headers["content-type"], "application/json");
  });

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
    headers: {},
  });
});

test.serial("Add auth header if present", async (t) => {
  t.plan(3);
  const authHeaderValue = "Bearer 00000";

  server.use(
    http.get(
      "*/demo-endpoint",
      ({ request }) => {
        t.is(request.headers.get("authorization"), authHeaderValue);

        return HttpResponse.text();
      },
      { once: true },
    ),
  );

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
    http.get(
      "*/demo-endpoint",
      ({ request }) => {
        t.is(request.headers.get("authorization"), null);

        return HttpResponse.text();
      },
      { once: true },
    ),
  );

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
    unauthenticated: true,
  });

  // Unset auth.
  drupalkit.unsetAuth();

  server.resetHandlers();
  server.use(
    http.get(
      "*/demo-endpoint",
      ({ request }) => {
        t.is(request.headers.get("authorization"), null);

        return HttpResponse.text();
      },
      { once: true },
    ),
  );

  await drupalkit.request("/demo-endpoint", {
    method: "GET",
  });
});

test.serial("Handle network errors", async (t) => {
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
});

test.serial("Allow options overrides", async (t) => {
  t.plan(3);

  server.use(
    http.get("*/en/demo-endpoint", () => {
      return HttpResponse.json(DemoEndpointResponse);
    }),
  );

  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
    defaultLocale: "de",
  });

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "force-cache");
    t.deepEqual(options.next, {
      revalidate: 5,
      tags: ["tag1", "user:3"],
    });
  });

  const result = await drupalkit.request(
    "/demo-endpoint",
    {
      method: "GET",
      headers: {},
      locale: "de",
    },
    {
      locale: "en",
      cache: "force-cache",
      // @ts-ignore
      next: {
        revalidate: 5,
        tags: ["tag1", "user:3"],
      },
    },
  );

  const response = result.unwrap();

  t.assert(response.url.includes("/en/demo-endpoint"));
});
