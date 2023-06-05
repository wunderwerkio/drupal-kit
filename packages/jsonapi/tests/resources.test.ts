import test from "ava";
import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit } from "@drupal-kit/core";

import { DrupalkitJsonApi, DrupalkitJsonApiError } from "../src/index.js";
import JsonApiArticleCollection from "./fixtures/jsonapi_article_collection.json" assert { type: "json" };
import JsonApiArticleDetail from "./fixtures/jsonapi_article_detail.json" assert { type: "json" };
import JsonApiIncludeError from "./fixtures/jsonapi_include_error.json" assert { type: "json" };
import JsonApiIndex from "./fixtures/jsonapi_index.json" assert { type: "json" };
import JsonApiIndexError from "./fixtures/jsonapi_index_error.json" assert { type: "json" };
import "./types.js";

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

test("Build JSON:API url", (t) => {
  const drupalkit = createDrupalkit();
  const queryParams = new DrupalJsonApiParams();
  queryParams
    .addGroup("group")
    .addFilter("status", "1", "=", "test")
    .addSort("name", "ASC")
    .addInclude(["one", "two"])
    .addCustomParam({
      revision: "5",
    });

  // Simple url.
  let url = drupalkit.jsonApi.buildJsonApiUrl("node/article");
  t.snapshot(url);

  // With query.
  url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
    query: queryParams.getQueryObject(),
  });
  t.snapshot(url);

  // With locale.
  url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
    localeOverride: "es",
  });
  t.snapshot(url);

  // With locale and query.
  url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
    localeOverride: "es",
    query: queryParams.getQueryObject(),
  });
  t.snapshot(url);
});

test.serial("Get JSON:API index", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.get("*/jsonapi", (_req, res, ctx) =>
      res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.json(JsonApiIndex),
      ),
    ),
  );

  let index = await drupalkit.jsonApi.getIndex();

  const res = index.unwrap();

  t.snapshot(JSON.stringify(res));
  t.assert(res.hasOwnProperty("jsonapi"));
  t.assert(res.hasOwnProperty("data"));
  t.assert(res.hasOwnProperty("links"));

  // With error
  server.resetHandlers();
  server.use(
    rest.get("*/jsonapi", (_req, res, ctx) =>
      res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.status(500),
        ctx.json(JsonApiIndexError),
      ),
    ),
  );

  index = await drupalkit.jsonApi.getIndex();

  const err = index.expectErr("Expect error");
  t.assert(err instanceof DrupalkitJsonApiError);
});

test.serial("Get JSON:API resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    rest.get("*/jsonapi/node/article/" + uuid, (_req, res, ctx) =>
      res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.json(JsonApiArticleDetail),
      ),
    ),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readSingle",
    {
      uuid,
    },
  );

  const res = result.unwrap();
  t.snapshot(res);
});

test.serial("Simplify single resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    rest.get("*/jsonapi/node/article/" + uuid, (_req, res, ctx) =>
      res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.json(JsonApiArticleDetail),
      ),
    ),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readSingle",
    {
      uuid,
    },
  );

  const res = result.unwrap();
  const data = drupalkit.jsonApi.simplifyResourceResponse(res);

  t.snapshot(data);
});

test.serial("Get localized JSON:API resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  t.plan(2);

  server.use(
    rest.get("*/jsonapi/node/article/" + uuid, (req, res, ctx) => {
      t.assert(req.url.toString().includes("/en/jsonapi"));

      return res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.json(JsonApiArticleDetail),
      );
    }),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readSingle",
    {
      uuid,
    },
    {
      localeOverride: "en",
    },
  );

  const res = result.unwrap();
  t.snapshot(res);
});

test.serial("Get JSON:API resource with query parameters", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  const queryParams = new DrupalJsonApiParams();
  queryParams.addInclude(["uid"]);
  queryParams.addCustomParam({ resourceVersion: "id:3" });

  server.use(
    rest.get("*/jsonapi/node/article/" + uuid, (req, res, ctx) => {
      t.snapshot(req.url.toString());

      return res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.json(JsonApiArticleDetail),
      );
    }),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readSingle",
    {
      uuid,
      queryParams,
    },
  );

  t.assert(result.ok);
});

test.serial("Handle error when getting single resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  const queryParams = new DrupalJsonApiParams();
  queryParams.addInclude(["wrong-field"]);

  server.use(
    rest.get("*/jsonapi/node/article/" + uuid, (_req, res, ctx) => {
      return res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.status(400),
        ctx.json(JsonApiIncludeError),
      );
    }),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readSingle",
    {
      uuid,
      queryParams,
    },
  );

  const err = result.expectErr("Expect error");

  t.assert(err instanceof DrupalkitJsonApiError);
  t.is(err.statusCode, 400);
});

test.serial("Get many resources", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.get("*/jsonapi/node/article", (_req, res, ctx) => {
      return res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.status(200),
        ctx.json(JsonApiArticleCollection),
      );
    }),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readMany",
    {},
  );

  const res = result.unwrap();
  t.snapshot(res);
});

test.serial("Simplify many resources", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.get("*/jsonapi/node/article", (_req, res, ctx) => {
      return res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.status(200),
        ctx.json(JsonApiArticleCollection),
      );
    }),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readMany",
    {},
  );

  const res = result.unwrap();
  const data = drupalkit.jsonApi.simplifyResourceResponse(res);

  t.assert(data.length === 8);
  t.snapshot(data);
});

test.serial("Handle error when getting many resource", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.get("*/jsonapi/node/article", (_req, res, ctx) => {
      return res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.status(400),
        ctx.json(JsonApiIncludeError),
      );
    }),
  );
  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readMany",
    {},
  );

  const err = result.expectErr("Expect error");

  t.assert(err instanceof DrupalkitJsonApiError);
  t.is(err.statusCode, 400);
});

test.serial("Handle network error", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.get("*/jsonapi/node/article", (_req, res) => {
      return res.networkError("Network Error");
    }),
  );
  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readMany",
    {},
  );

  const err = result.expectErr("Expect error");

  t.assert(err.message.includes("Failed to fetch"), err.message);
  t.is(err.response, undefined);
});

test.serial("Create new resource", async (t) => {
  const drupalkit = createDrupalkit();

  t.plan(3);

  server.use(
    rest.post("*/jsonapi/node/article", async (req, res, ctx) => {
      const payload = await req.json();
      t.is(payload.type, "node--article");

      return res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.json(JsonApiArticleDetail),
      );
    }),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "create", {
    payload: {
      attributes: {
        title: "New Article",
      },
      relationships: {
        uid: {
          data: {
            type: "user--user",
            id: "1",
            meta: {},
          },
        },
      },
    },
  });

  const res = result.unwrap();
  t.snapshot(res);

  const simpleData = drupalkit.jsonApi.simplifyResourceResponse(res);
  t.snapshot(simpleData);
});

test.serial("Handle error when creating new resource", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.post("*/jsonapi/node/article", (_req, res, ctx) =>
      res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.status(400),
        ctx.json(JsonApiIncludeError),
      ),
    ),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "create", {
    payload: {
      type: "node--article",
      attributes: {
        title: "New Article",
      },
      relationships: {
        uid: {
          data: {
            type: "user--user",
            id: "1",
            meta: {},
          },
        },
      },
    },
  });

  const error = result.expectErr("Expect error");

  t.assert(error instanceof DrupalkitJsonApiError);
  t.is(error.statusCode, 400);
});

test.serial("Update resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  t.plan(4);

  server.use(
    rest.patch("*/jsonapi/node/article/" + uuid, async (req, res, ctx) => {
      const payload = await req.json();

      t.is(payload.type, "node--article");
      t.is(payload.id, uuid);

      return res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.json(JsonApiArticleDetail),
      );
    }),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "update", {
    uuid,
    payload: {
      attributes: {
        title: "New title",
      },
    },
  });

  const res = result.unwrap();
  t.snapshot(res);

  const simpleData = drupalkit.jsonApi.simplifyResourceResponse(res);
  t.snapshot(simpleData);
});

test.serial("Handle error when updating resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    rest.patch("*/jsonapi/node/article/" + uuid, (_req, res, ctx) =>
      res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.status(400),
        ctx.json(JsonApiIncludeError),
      ),
    ),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "update", {
    uuid,
    payload: {
      attributes: {
        title: "New title",
      },
    },
  });

  const error = result.expectErr("Expect error");

  t.assert(error instanceof DrupalkitJsonApiError);
  t.is(error.statusCode, 400);
});

test.serial("Delete resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    rest.delete("*/jsonapi/node/article/" + uuid, (_req, res, ctx) =>
      res(ctx.set("Content-Type", "application/vnd.api+json"), ctx.status(204)),
    ),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "delete", {
    uuid,
  });

  const res = result.unwrap();
  t.assert(res);
});

test.serial("Handle error when deleting resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    rest.delete("*/jsonapi/node/article/" + uuid, (_req, res, ctx) =>
      res(
        ctx.set("Content-Type", "application/vnd.api+json"),
        ctx.status(400),
        ctx.json(JsonApiIncludeError),
      ),
    ),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "delete", {
    uuid,
  });

  const error = result.expectErr("Expect error");

  t.assert(error instanceof DrupalkitJsonApiError);
  t.is(error.statusCode, 400);
});
