import test from "ava";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { DrupalkitVerification } from "../src/index.js";
import {
  hashVerification,
  magicCodeVerification,
} from "../src/verification.js";

const BASE_URL = "https://my-drupal.com";

const createDrupalkit = (
  options: DrupalkitOptions = {
    baseUrl: BASE_URL,
  },
) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitVerification);

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

  t.assert(drupalkit.hasOwnProperty("verification"));
});

test.serial("Add Hash verification to a request once", async (t) => {
  t.plan(4);
  let first = true;

  const drupalkit = createDrupalkit();
  const hash = "0123456789abcdef";

  server.use(
    http.get("*/", async ({ request }) => {
      if (first) {
        t.is(request.headers.get("x-verification-hash"), hash);
        first = false;
      } else {
        t.not(request.headers.get("x-verification-hash"), hash);
      }

      return HttpResponse.text()
    }),
  );

  // First request.
  drupalkit.addVerification(hashVerification(hash));
  let result = await drupalkit.request("/", {
    method: "GET",
  });

  t.assert(result.ok);

  // Second request.
  result = await drupalkit.request("/", {
    method: "GET",
  });

  t.assert(result.ok);
});

test.serial("Add Magic code verification to a request once", async (t) => {
  t.plan(4);
  let first = true;

  const drupalkit = createDrupalkit();
  const code = "5ZL-KD2";

  server.use(
    http.get("*/", async ({ request }) => {
      if (first) {
        t.is(request.headers.get("x-verification-magic-code"), code);
        first = false;
      } else {
        t.not(request.headers.get("x-verification-magic-code"), code);
      }

      return HttpResponse.text()
    }),
  );

  drupalkit.addVerification(magicCodeVerification(code));

  // First request.
  let result = await drupalkit.request("/", {
    method: "GET",
  });

  t.assert(result.ok);

  // Second request.
  result = await drupalkit.request("/", {
    method: "GET",
  });

  t.assert(result.ok);
});
