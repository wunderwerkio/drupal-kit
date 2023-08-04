import test from "ava";
import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit } from "@drupal-kit/core";

import { DrupalkitJsonApi, DrupalkitJsonApiError } from "../src/index.js";
import JsonApiMenuItems from "./fixtures/jsonapi_menu_items.json" assert { type: "json" };
import JsonApiMenuItemsError from "./fixtures/jsonapi_menu_items_error.json" assert { type: "json" };

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

test.before(() => {
  server.listen();
});

test.afterEach(() => {
  server.resetHandlers();
});

test.after(() => {
  server.close();
});

test.serial("Get menu items", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.get("*/jsonapi/menu_items/my_menu", (_req, res, ctx) =>
      res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.json(JsonApiMenuItems),
      ),
    ),
  );

  const result = await drupalkit.jsonApi.getMenuItems("my_menu");

  const res = result.unwrap();

  t.snapshot(res);
});

test.serial("Get menu items with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    rest.get("*/jsonapi/menu_items/my_menu", (req, res, ctx) => {
      t.is(req.headers.get("x-custom"), "1");

      return res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.json(JsonApiMenuItems),
      );
    }),
  );

  await drupalkit.jsonApi.getMenuItems("my_menu", {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Get menu items for non-existant menu", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.get("*/jsonapi/menu_items/non_existant", (_req, res, ctx) =>
      res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.status(404),
        ctx.json(JsonApiMenuItemsError),
      ),
    ),
  );

  const result = await drupalkit.jsonApi.getMenuItems("non_existant");

  const err = result.expectErr("Expect error");

  t.assert(err instanceof DrupalkitJsonApiError);
  t.is(err.statusCode, 404);
});
