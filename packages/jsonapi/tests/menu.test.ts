import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit } from "@drupal-kit/core";

import { DrupalkitJsonApi, DrupalkitJsonApiError } from "../src/index.js";
import JsonApiMenuItemsError from "./fixtures/jsonapi_menu_items_error.js";
import JsonApiMenuItems from "./fixtures/jsonapi_menu_items.js";

const BASE_URL = "https://my-drupal.com";

type test = string;

const createDrupalkit = ({ baseUrl = BASE_URL }: { baseUrl?: string } = {}) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitJsonApi);

  return new EnhancedDrupalkit({
    baseUrl,
    locale: "de",
    defaultLocale: "de",
  });
};

const server = setupServer();

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

test("Get menu items", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/jsonapi/menu_items/my_menu", () =>
      HttpResponse.json(JsonApiMenuItems, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
    ),
  );

  const result = await drupalkit.jsonApi.getMenuItems("my_menu");

  const res = result.unwrap();

  expect(res).toMatchSnapshot();
});

test("Get menu items with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.get("*/jsonapi/menu_items/my_menu", ({ request }) => {
      expect(request.headers.get("x-custom")).toBe("1");

      return HttpResponse.json(JsonApiMenuItems, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
    }),
  );

  await drupalkit.jsonApi.getMenuItems("my_menu", {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Get menu items for non-existant menu", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/jsonapi/menu_items/non_existant", () =>
      HttpResponse.json(JsonApiMenuItemsError, {
        status: 404,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
    ),
  );

  const result = await drupalkit.jsonApi.getMenuItems("non_existant");

  const err = result.expectErr("Expect error");

  expect(err instanceof DrupalkitJsonApiError).toBeTruthy();
  expect(err.statusCode).toBe(404);
});
