import test from "ava";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { DrupalkitConsumers } from "../src/index.js";

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

const BASE_URL = "https://my-drupal.com";
const CONSUMER_ID = "my-consumer-uuid";

const createDrupalkit = (
  options: DrupalkitOptions = {
    baseUrl: BASE_URL,
  },
) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitConsumers);

  return new EnhancedDrupalkit({
    locale: "de",
    defaultLocale: "de",
    ...options,
  });
};

test.serial("Add consumer id to request", async (t) => {
  t.plan(2);

  server.use(
    http.get("*", ({ request }) => {
      t.is(request.headers.get("X-Consumer-ID"), CONSUMER_ID);

      return HttpResponse.text();
    }),
  );

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    consumerId: CONSUMER_ID,
  });

  const result = await drupalkit.request("/", {
    method: "GET",
  });

  t.assert(result.ok);
});

test.serial(
  "Do not add consumer id header if no value is supplied",
  async (t) => {
    t.plan(1);

    server.use(
      http.get("*", ({ request }) => {
        t.is(request.headers.get("X-Consumer-ID"), null);

        return HttpResponse.text();
      }),
    );

    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
    });

    await drupalkit.request("/", {
      method: "GET",
    });
  },
);

test.serial("Add consumer id with custom header name", async (t) => {
  t.plan(1);

  server.use(
    http.get("*", ({ request }) => {
      t.is(request.headers.get("X-Custom-Consumer-ID"), CONSUMER_ID);

      return HttpResponse.text();
    }),
  );

  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    consumerId: CONSUMER_ID,
    consumerHeaderName: "X-Custom-Consumer-ID",
  });

  await drupalkit.request("/", {
    method: "GET",
  });
});

test.serial(
  "Add consumer id to request - via deprecated consumerUUID",
  async (t) => {
    t.plan(2);

    server.use(
      http.get("*", ({ request }) => {
        t.is(request.headers.get("X-Consumer-ID"), CONSUMER_ID);

        return HttpResponse.text();
      }),
    );

    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      consumerUUID: CONSUMER_ID,
    });

    const result = await drupalkit.request("/", {
      method: "GET",
    });

    t.assert(result.ok);
  },
);

test.serial(
  "Do not overwrite already existing consumer id header",
  async (t) => {
    const otherId = "other";
    t.plan(2);

    server.use(
      http.get("*", ({ request }) => {
        t.is(request.headers.get("X-Consumer-ID"), otherId);

        return HttpResponse.text();
      }),
    );

    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      consumerUUID: CONSUMER_ID,
    });

    const result = await drupalkit.request("/", {
      method: "GET",
      headers: {
        "X-Consumer-ID": otherId,
      },
    });

    t.assert(result.ok);
  },
);
