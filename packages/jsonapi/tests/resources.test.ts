import test from "ava";
import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit } from "@drupal-kit/core";

import { DrupalkitJsonApi, DrupalkitJsonApiError } from "../src/index.js";
import JsonApiArticleCollection from "./fixtures/jsonapi_article_collection.json" with { type: "json" };
import JsonApiArticleDetail from "./fixtures/jsonapi_article_detail.json" with { type: "json" };
import JsonApiIncludeError from "./fixtures/jsonapi_include_error.json" with { type: "json" };
import JsonApiIndexError from "./fixtures/jsonapi_index_error.json" with { type: "json" };
import JsonApiIndex from "./fixtures/jsonapi_index.json" with { type: "json" };

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

/**
 * getIndex().
 */

test.serial("Get JSON:API index", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/jsonapi", () =>
      HttpResponse.json(JsonApiIndex, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
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
    http.get("*/jsonapi", () =>
      HttpResponse.json(JsonApiIndexError, {
        status: 500,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
    ),
  );

  index = await drupalkit.jsonApi.getIndex();

  const err = index.expectErr("Expect error");
  t.assert(err instanceof DrupalkitJsonApiError);
});

test.serial("Get JSON:API index with options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.get("*/jsonapi", ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(JsonApiIndex, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
    }),
  );

  await drupalkit.jsonApi.getIndex({
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

/**
 * .resource() - "readSingle".
 */

test.serial("Get JSON:API resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.get("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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

test.serial("Get JSON:API resource with options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.get("*/jsonapi/node/article/" + uuid, ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
    }),
  );

  await drupalkit.jsonApi.resource(
    "node--article",
    "readSingle",
    {
      uuid,
    },
    {
      cache: "no-cache",
      headers: {
        "X-Custom": "1",
      },
    },
  );
});

test.serial("Simplify single resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.get("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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
    http.get("*/jsonapi/node/article/" + uuid, ({ request }) => {
      t.assert(request.url.toString().includes("/en/jsonapi"));

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
    }),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readSingle",
    {
      uuid,
    },
    {
      locale: "en",
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
    http.get("*/jsonapi/node/article/" + uuid, ({ request }) => {
      t.snapshot(request.url.toString());

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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
    http.get("*/jsonapi/node/article/" + uuid, () => {
      return HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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

/**
 * .resource() - "readMany".
 */

test.serial("Get many resources", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/jsonapi/node/article", () => {
      return HttpResponse.json(JsonApiArticleCollection, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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

test.serial("Get many resources with custom request options", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.get("*/jsonapi/node/article", ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");
      t.assert(request.url.toString().includes("/en/jsonapi"));

      return HttpResponse.json(JsonApiArticleCollection, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
    }),
  );

  await drupalkit.jsonApi.resource(
    "node--article",
    "readMany",
    {},
    {
      locale: "en",
      cache: "no-cache",
      headers: {
        "X-Custom": "1",
      },
    },
  );
});

test.serial("Simplify many resources", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/jsonapi/node/article", () => {
      return HttpResponse.json(JsonApiArticleCollection, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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
    http.get("*/jsonapi/node/article", () => {
      return HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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
    http.get("*/jsonapi/node/article", () => {
      return HttpResponse.error();
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

/**
 * .resource() - "create".
 */

test.serial("Create new resource", async (t) => {
  const drupalkit = createDrupalkit();

  t.plan(3);

  server.use(
    http.post("*/jsonapi/node/article", async ({ request }) => {
      const payload = await request.json();
      t.is((payload as any).data.type, "node--article");

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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

test.serial("Create resource with custom request options", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/jsonapi/node/article", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");
      t.assert(request.url.toString().includes("/en/jsonapi"));

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
    }),
  );

  await drupalkit.jsonApi.resource(
    "node--article",
    "create",
    {
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
    },
    {
      locale: "en",
      cache: "no-cache",
      headers: {
        "X-Custom": "1",
      },
    },
  );
});

test.serial("Handle error when creating new resource", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/jsonapi/node/article", () =>
      HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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

/**
 * .resource() - "update".
 */

test.serial("Update resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  t.plan(4);

  server.use(
    http.patch("*/jsonapi/node/article/" + uuid, async ({ request }) => {
      const payload = await request.json() as any;

      t.is(payload.data.type, "node--article");
      t.is(payload.data.id, uuid);

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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

test.serial("Update resource with custom request options", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.patch("*/jsonapi/node/article/" + uuid, async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");
      t.assert(request.url.toString().includes("/en/jsonapi"));

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
    }),
  );

  await drupalkit.jsonApi.resource(
    "node--article",
    "update",
    {
      uuid,
      payload: {
        attributes: {
          title: "New Article",
        },
      },
    },
    {
      locale: "en",
      cache: "no-cache",
      headers: {
        "X-Custom": "1",
      },
    },
  );
});

test.serial("Handle error when updating resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.patch("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
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

/**
 * .resource() - "delete".
 */

test.serial("Delete resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.delete("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.text(null, {
        status: 204,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
    ),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "delete", {
    uuid,
  });

  const res = result.unwrap();
  t.assert(res);
});

test.serial("Delete resource with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.delete("*/jsonapi/node/article/" + uuid, ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
    }),
  );

  await drupalkit.jsonApi.resource(
    "node--article",
    "delete",
    {
      uuid,
    },
    {
      cache: "no-cache",
      headers: {
        "X-Custom": "1",
      },
    },
  );
});

test.serial("Handle error when deleting resource", async (t) => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.delete("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      })
    ),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "delete", {
    uuid,
  });

  const error = result.expectErr("Expect error");

  t.assert(error instanceof DrupalkitJsonApiError);
  t.is(error.statusCode, 400);
});
