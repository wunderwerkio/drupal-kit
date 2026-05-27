import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit } from "@drupal-kit/core";

import { DrupalkitJsonApi, DrupalkitJsonApiError } from "../src/index.js";
import JsonApiArticleCollection from "./fixtures/jsonapi_article_collection.js";
import JsonApiArticleDetail from "./fixtures/jsonapi_article_detail.js";
import JsonApiFileUpload from "./fixtures/jsonapi_file_upload.js";
import JsonApiIncludeError from "./fixtures/jsonapi_include_error.js";
import JsonApiIndexError from "./fixtures/jsonapi_index_error.js";
import JsonApiIndex from "./fixtures/jsonapi_index.js";

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

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

test("Build JSON:API url", () => {
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
  expect(url).toMatchSnapshot();

  // With query.
  url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
    query: queryParams.getQueryObject(),
  });
  expect(url).toMatchSnapshot();

  // With locale.
  url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
    localeOverride: "es",
  });
  expect(url).toMatchSnapshot();

  // With locale and query.
  url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
    localeOverride: "es",
    query: queryParams.getQueryObject(),
  });
  expect(url).toMatchSnapshot();
});

/**
 * getIndex().
 */

test("Get JSON:API index", async () => {
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

  expect(JSON.stringify(res)).toMatchSnapshot();
  expect(res.hasOwnProperty("jsonapi")).toBeTruthy();
  expect(res.hasOwnProperty("data")).toBeTruthy();
  expect(res.hasOwnProperty("links")).toBeTruthy();

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
  expect(err instanceof DrupalkitJsonApiError).toBeTruthy();
});

test("Get JSON:API index with options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.get("*/jsonapi", ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

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

test("Get JSON:API resource", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.get("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
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
  expect(res).toMatchSnapshot();
});

test("Get JSON:API resource with options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.get("*/jsonapi/node/article/" + uuid, ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
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

test("Simplify single resource", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.get("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
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

  expect(data).toMatchSnapshot();
});

test("Get localized JSON:API resource", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  expect.assertions(2);

  server.use(
    http.get("*/jsonapi/node/article/" + uuid, ({ request }) => {
      expect(request.url.toString().includes("/en/jsonapi")).toBeTruthy();

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
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
  expect(res).toMatchSnapshot();
});

test("Get JSON:API resource with query parameters", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  const queryParams = new DrupalJsonApiParams();
  queryParams.addInclude(["uid"]);
  queryParams.addCustomParam({ resourceVersion: "id:3" });

  server.use(
    http.get("*/jsonapi/node/article/" + uuid, ({ request }) => {
      expect(request.url.toString()).toMatchSnapshot();

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
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

  expect(result.ok).toBeTruthy();
});

test("Handle error when getting single resource", async () => {
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
      });
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

  expect(err instanceof DrupalkitJsonApiError).toBeTruthy();
  expect(err.statusCode).toBe(400);
});

/**
 * .resource() - "readMany".
 */

test("Get many resources", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/jsonapi/node/article", () => {
      return HttpResponse.json(JsonApiArticleCollection, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
    }),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readMany",
    {},
  );

  const res = result.unwrap();
  expect(res).toMatchSnapshot();
});

test("Get many resources with custom request options", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.get("*/jsonapi/node/article", ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");
      expect(request.url.toString().includes("/en/jsonapi")).toBeTruthy();

      return HttpResponse.json(JsonApiArticleCollection, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
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

test("Simplify many resources", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/jsonapi/node/article", () => {
      return HttpResponse.json(JsonApiArticleCollection, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
    }),
  );

  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readMany",
    {},
  );

  const res = result.unwrap();
  const data = drupalkit.jsonApi.simplifyResourceResponse(res);

  expect(data.length === 8).toBeTruthy();
  expect(data).toMatchSnapshot();
});

test("Handle error when getting many resource", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.get("*/jsonapi/node/article", () => {
      return HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
    }),
  );
  const result = await drupalkit.jsonApi.resource(
    "node--article",
    "readMany",
    {},
  );

  const err = result.expectErr("Expect error");

  expect(err instanceof DrupalkitJsonApiError).toBeTruthy();
  expect(err.statusCode).toBe(400);
});

test("Handle network error", async () => {
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

  expect(err.message.includes("Failed to fetch"), err.message).toBeTruthy();
  expect(err.response).toBe(undefined);
});

/**
 * .resource() - "create".
 */

test("Create new resource", async () => {
  const drupalkit = createDrupalkit();

  expect.assertions(3);

  server.use(
    http.post("*/jsonapi/node/article", async ({ request }) => {
      const payload = await request.json();
      expect((payload as any).data.type).toBe("node--article");

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
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
  expect(res).toMatchSnapshot();

  const simpleData = drupalkit.jsonApi.simplifyResourceResponse(res);
  expect(simpleData).toMatchSnapshot();
});

test("Create resource with custom request options", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/jsonapi/node/article", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");
      expect(request.url.toString().includes("/en/jsonapi")).toBeTruthy();

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
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

test("Handle error when creating new resource", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/jsonapi/node/article", () =>
      HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
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

  expect(error instanceof DrupalkitJsonApiError).toBeTruthy();
  expect(error.statusCode).toBe(400);
});

/**
 * .resource() - "update".
 */

test("Update resource", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  expect.assertions(4);

  server.use(
    http.patch("*/jsonapi/node/article/" + uuid, async ({ request }) => {
      const payload = (await request.json()) as any;

      expect(payload.data.type).toBe("node--article");
      expect(payload.data.id).toBe(uuid);

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
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
  expect(res).toMatchSnapshot();

  const simpleData = drupalkit.jsonApi.simplifyResourceResponse(res);
  expect(simpleData).toMatchSnapshot();
});

test("Update resource with custom request options", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.patch("*/jsonapi/node/article/" + uuid, async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");
      expect(request.url.toString().includes("/en/jsonapi")).toBeTruthy();

      return HttpResponse.json(JsonApiArticleDetail, {
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
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

test("Handle error when updating resource", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.patch("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
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

  expect(error instanceof DrupalkitJsonApiError).toBeTruthy();
  expect(error.statusCode).toBe(400);
});

/**
 * .resource() - "delete".
 */

test("Delete resource", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.delete("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.text(null, {
        status: 204,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
    ),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "delete", {
    uuid,
  });

  const res = result.unwrap();
  expect(res).toBeTruthy();
});

test("Delete resource with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.delete("*/jsonapi/node/article/" + uuid, ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      });
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

test("Handle error when deleting resource", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

  server.use(
    http.delete("*/jsonapi/node/article/" + uuid, () =>
      HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
    ),
  );

  const result = await drupalkit.jsonApi.resource("node--article", "delete", {
    uuid,
  });

  const error = result.expectErr("Expect error");

  expect(error instanceof DrupalkitJsonApiError).toBeTruthy();
  expect(error.statusCode).toBe(400);
});

/**
 * uploadFile().
 */

test("Upload file to entity field", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";
  const fileData = new Blob(["fake-image-data"], { type: "image/jpeg" });

  expect.assertions(4);

  server.use(
    http.post(
      "*/jsonapi/node/with-file/" + uuid + "/field_image",
      async ({ request }) => {
        expect(request.headers.get("Content-Type")).toBe(
          "application/octet-stream",
        );
        expect(request.headers.get("Content-Disposition")).toBe(
          'file; filename="test-image.jpg"',
        );

        const body = await request.arrayBuffer();
        expect(body.byteLength).toBe(fileData.size);

        return HttpResponse.json(JsonApiFileUpload, {
          status: 201,
          headers: {
            "Content-Type": "application/vnd.api+json",
          },
        });
      },
    ),
  );

  const result = await drupalkit.jsonApi.uploadFile(
    "node--with-file",
    uuid,
    "field_image",
    fileData,
    "test-image.jpg",
  );

  const res = result.unwrap();
  expect(res.data?.type).toBe("file--file");
});

test("Upload file with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";
  const fileData = new Blob(["fake-data"]);

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post(
      "*/jsonapi/node/with-file/" + uuid + "/field_image",
      ({ request }) => {
        expect(request.headers.get("X-Custom")).toBe("1");

        return HttpResponse.json(JsonApiFileUpload, {
          status: 201,
          headers: {
            "Content-Type": "application/vnd.api+json",
          },
        });
      },
    ),
  );

  await drupalkit.jsonApi.uploadFile(
    "node--with-file",
    uuid,
    "field_image",
    fileData,
    "test.jpg",
    {
      cache: "no-cache",
      headers: {
        "X-Custom": "1",
      },
    },
  );
});

test("Upload file sanitizes filename", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";
  const fileData = new Blob(["fake-data"]);

  expect.assertions(1);

  server.use(
    http.post(
      "*/jsonapi/node/with-file/" + uuid + "/field_image",
      ({ request }) => {
        expect(request.headers.get("Content-Disposition")).toBe(
          'file; filename="ueber-bild.jpg"',
        );

        return HttpResponse.json(JsonApiFileUpload, {
          status: 201,
          headers: {
            "Content-Type": "application/vnd.api+json",
          },
        });
      },
    ),
  );

  await drupalkit.jsonApi.uploadFile(
    "node--with-file",
    uuid,
    "field_image",
    fileData,
    "über-bild.jpg",
  );
});

test("Upload file validates filename extension", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";
  const fileData = new Blob(["fake-data"]);

  const result = await drupalkit.jsonApi.uploadFile(
    "node--with-file",
    uuid,
    "field_image",
    fileData,
    "noextension",
  );

  const err = result.expectErr("Expect validation error");

  expect(err instanceof DrupalkitJsonApiError).toBeTruthy();
  expect(err.message).toBe("Filename must include a file extension");
  expect(err.statusCode).toBe(400);
});

test("Handle error when uploading file", async () => {
  const drupalkit = createDrupalkit();
  const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";
  const fileData = new Blob(["fake-data"]);

  server.use(
    http.post("*/jsonapi/node/with-file/" + uuid + "/field_image", () =>
      HttpResponse.json(JsonApiIncludeError, {
        status: 400,
        headers: {
          "Content-Type": "application/vnd.api+json",
        },
      }),
    ),
  );

  const result = await drupalkit.jsonApi.uploadFile(
    "node--with-file",
    uuid,
    "field_image",
    fileData,
    "test.jpg",
  );

  const error = result.expectErr("Expect error");

  expect(error instanceof DrupalkitJsonApiError).toBeTruthy();
  expect(error.statusCode).toBe(400);
});
