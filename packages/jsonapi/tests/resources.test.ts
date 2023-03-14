import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { DrupalJsonApiParams } from "drupal-jsonapi-params";
import { Drupalkit } from "@drupalkit/core";
import { mockNetworkError, mockResponse } from "@drupalkit/core/test-utils";
import { DrupalkitError } from "@drupalkit/error";

import { DrupalkitJsonApi, DrupalkitJsonApiError } from "../src/index";
import JsonApiArticleCollection from "./fixtures/jsonapi_article_collection.json";
import JsonApiArticleDetail from "./fixtures/jsonapi_article_detail.json";
import JsonApiIncludeError from "./fixtures/jsonapi_include_error.json";
import JsonApiIndex from "./fixtures/jsonapi_index.json";
import JsonApiIndexError from "./fixtures/jsonapi_index_error.json";
import "./types";

enableFetchMocks();

describe("resources", () => {
  const BASE_URL = "https://my-drupal.com";

  const createDrupalkit = ({
    baseUrl = BASE_URL,
  }: { baseUrl?: string } = {}) => {
    const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitJsonApi);

    return new EnhancedDrupalkit({
      baseUrl,
      locale: "de",
      defaultLocale: "de",
    });
  };

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  /**
   * Build JSON:API url.
   */
  it("should build json api url", () => {
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
    expect(url).toMatchSnapshot("simple");

    // With query.
    url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
      query: queryParams.getQueryObject(),
    });
    expect(url).toMatchSnapshot("with-query");

    // With locale.
    url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
      localeOverride: "es",
    });
    expect(url).toMatchSnapshot("with-locale");

    // With locale and query.
    url = drupalkit.jsonApi.buildJsonApiUrl("node/article", {
      localeOverride: "es",
      query: queryParams.getQueryObject(),
    });
    expect(url).toMatchSnapshot("with-locale-and-query");
  });

  /**
   * Get JSON:API index.
   */
  it("should get jsonapi index", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/jsonapi",
      payloadFixture: JsonApiIndex,
      contentType: "application/vnd.api+json",
    });

    let index = await drupalkit.jsonApi.getIndex();

    expect(index.ok).toBeTruthy();

    if (index.ok) {
      expect(JSON.stringify(index.val)).toMatchSnapshot("jsonapi-index");

      expect(index.val).toHaveProperty("jsonapi");
      expect(index.val).toHaveProperty("data");
      expect(index.val).toHaveProperty("links");
    }

    // With error
    mockResponse(fetchMock, drupalkit, {
      url: "/jsonapi",
      payloadFixture: JsonApiIndexError,
      status: 500,
      contentType: "application/vnd.api+json",
    });

    index = await drupalkit.jsonApi.getIndex();

    expect(index.err).toBeTruthy();

    if (index.err) {
      expect(index.val).toBeInstanceOf(DrupalkitError);
    }
  });

  /**
   * Get single JSON:API resource.
   */
  it("should get json api resource", async () => {
    const drupalkit = createDrupalkit();
    const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

    mockResponse(fetchMock, drupalkit, {
      url: "/jsonapi/node/article/" + uuid,
      payloadFixture: JsonApiArticleDetail,
      contentType: "application/vnd.api+json",
    });

    const result = await drupalkit.jsonApi.resource(
      "node--article",
      "readSingle",
      {
        uuid,
      },
    );

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toMatchSnapshot("get-single");
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  /**
   * Get single localized JSON:API resource.
   */
  it("should get localized json api resource", async () => {
    const drupalkit = createDrupalkit();
    const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

    mockResponse(fetchMock, drupalkit, {
      url: "/jsonapi/node/article/" + uuid,
      payloadFixture: JsonApiArticleDetail,
      contentType: "application/vnd.api+json",
      locale: "en",
    });

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

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toMatchSnapshot("get-single-localized");
    }
  });

  /**
   * Get single JSON:API resource with query parameters.
   */
  it("should get json api resource with query parameters", async () => {
    const drupalkit = createDrupalkit();
    const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

    const queryParams = new DrupalJsonApiParams();
    queryParams.addInclude(["uid"]);
    queryParams.addCustomParam({ resourceVersion: "id:3" });

    mockResponse(fetchMock, drupalkit, {
      url: /\/jsonapi\/node\/article\/.*/,
      payloadFixture: JsonApiArticleDetail,
      contentType: "application/vnd.api+json",
    });

    const result = await drupalkit.jsonApi.resource(
      "node--article",
      "readSingle",
      {
        uuid,
        queryParams,
      },
    );

    expect(result.ok).toBeTruthy();
    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toMatchSnapshot("single-query-url");
  });

  /**
   * Get single JSON:API resource with query parameters.
   */
  it("should handle error when getting single resource", async () => {
    const drupalkit = createDrupalkit();
    const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

    const queryParams = new DrupalJsonApiParams();
    queryParams.addInclude(["wrong-field"]);

    mockResponse(fetchMock, drupalkit, {
      url: /\/jsonapi\/node\/article\/.*/,
      payloadFixture: JsonApiIncludeError,
      contentType: "application/vnd.api+json",
      status: 400,
    });

    const result = await drupalkit.jsonApi.resource(
      "node--article",
      "readSingle",
      {
        uuid,
        queryParams,
      },
    );

    expect(result.err).toBeTruthy();

    if (result.err) {
      expect(result.val).toBeInstanceOf(DrupalkitJsonApiError);
      expect(result.val.statusCode).toBe(400);
    }
  });

  /**
   * Get many JSON:API resources.
   */
  it("should get many resources", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/jsonapi/node/article",
      payloadFixture: JsonApiArticleCollection,
      contentType: "application/vnd.api+json",
    });

    const result = await drupalkit.jsonApi.resource(
      "node--article",
      "readMany",
      {},
    );

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toMatchSnapshot("get-collection");
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  /**
   * Get many JSON:API resources with parameters.
   */
  it("should get many resources with query", async () => {
    const drupalkit = createDrupalkit();

    const queryParams = new DrupalJsonApiParams();
    queryParams.addPageOffset(0).addFilter("status", "true");

    mockResponse(fetchMock, drupalkit, {
      url: /\/jsonapi\/node\/article.*/,
      payloadFixture: JsonApiArticleCollection,
      contentType: "application/vnd.api+json",
      locale: "en",
    });

    const result = await drupalkit.jsonApi.resource(
      "node--article",
      "readMany",
      {
        queryParams,
      },
    );

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toMatchSnapshot("many-query-url");

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  /**
   * Handle errors when getting many resources.
   */
  it("should handle errors when getting many resources", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: /\/jsonapi\/node\/article.*/,
      payloadFixture: JsonApiIncludeError,
      contentType: "application/vnd.api+json",
      status: 400,
    });

    const result = await drupalkit.jsonApi.resource(
      "node--article",
      "readMany",
      {},
    );

    expect(result.err).toBeTruthy();

    if (result.err) {
      expect(result.val).toBeInstanceOf(DrupalkitJsonApiError);
      expect(result.val.statusCode).toBe(400);
    }
  });

  /**
   * Handle network errors.
   */
  it("should handle network errors", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const result = await drupalkit.jsonApi.resource(
      "node--article",
      "readMany",
      {},
    );

    expect(result.err).toBeTruthy();
    if (result.err) {
      expect(result.val.message).toBe("Network Error");
      expect(result.val.response).toBeUndefined();
    }
  });

  /**
   * Create JSON:API resource.
   */
  it("should create new resource", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/jsonapi/node/article",
      payloadFixture: JsonApiArticleDetail,
      contentType: "application/vnd.api+json",
    });

    const result = await drupalkit.jsonApi.resource("node--article", "create", {
      payload: {
        data: {
          type: "node--article",
          attributes: {
            title: "New Article",
          },
          relationships: {
            uid: {
              data: {
                type: "user--user",
                id: "1",
              },
            },
          },
        },
      },
    });

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.val).toMatchSnapshot("create");
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
    });
  });

  /**
   * Handle errors while creating JSON:API resource.
   */
  it("should handle error when creating new resource", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/jsonapi/node/article",
      payloadFixture: JsonApiIncludeError,
      contentType: "application/vnd.api+json",
      status: 400,
    });

    const result = await drupalkit.jsonApi.resource("node--article", "create", {
      payload: {
        data: {
          type: "node--article",
          attributes: {
            title: "New Article",
          },
          relationships: {
            uid: {
              data: {
                type: "user--user",
                id: "1",
              },
            },
          },
        },
      },
    });

    expect(result.err).toBeTruthy();

    if (result.err) {
      expect(result.val).toBeInstanceOf(DrupalkitJsonApiError);
      expect(result.val.statusCode).toBe(400);
    }
  });

  /**
   * Update JSON:API resource.
   */
  it("should update resource", async () => {
    const drupalkit = createDrupalkit();
    const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

    mockResponse(fetchMock, drupalkit, {
      url: /\/jsonapi\/node\/article\/.*/,
      payloadFixture: JsonApiArticleDetail,
      contentType: "application/vnd.api+json",
    });

    const result = await drupalkit.jsonApi.resource("node--article", "update", {
      uuid,
      payload: {
        data: {
          id: uuid,
          type: "node--article",
          attributes: {
            title: "New title",
          },
        },
      },
    });

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.val).toMatchSnapshot("update");
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
    });
  });

  /**
   * Handle errors while updating JSON:API resource.
   */
  it("should handle error when updating resource", async () => {
    const drupalkit = createDrupalkit();
    const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

    mockResponse(fetchMock, drupalkit, {
      url: /\/jsonapi\/node\/article\/.*/,
      payloadFixture: JsonApiIncludeError,
      contentType: "application/vnd.api+json",
      status: 400,
    });

    const result = await drupalkit.jsonApi.resource("node--article", "update", {
      uuid,
      payload: {
        data: {
          id: uuid,
          type: "node--article",
          attributes: {
            title: "New title",
          },
        },
      },
    });

    expect(result.err).toBeTruthy();

    if (result.err) {
      expect(result.val).toBeInstanceOf(DrupalkitJsonApiError);
      expect(result.val.statusCode).toBe(400);
    }
  });

  /**
   * Delete JSON:API resource.
   */
  it("should delete resource", async () => {
    const drupalkit = createDrupalkit();
    const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

    mockResponse(fetchMock, drupalkit, {
      url: /\/jsonapi\/node\/article\/.*/,
      payloadFixture: JsonApiArticleDetail,
      contentType: "application/vnd.api+json",
    });

    const result = await drupalkit.jsonApi.resource("node--article", "delete", {
      uuid,
    });

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.val).toBeTruthy();
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "DELETE",
    });
  });

  /**
   * Handle errors while deleting JSON:API resource.
   */
  it("should handle error when deleting resource", async () => {
    const drupalkit = createDrupalkit();
    const uuid = "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f";

    mockResponse(fetchMock, drupalkit, {
      url: /\/jsonapi\/node\/article\/.*/,
      payloadFixture: JsonApiIncludeError,
      contentType: "application/vnd.api+json",
      status: 400,
    });

    const result = await drupalkit.jsonApi.resource("node--article", "delete", {
      uuid,
    });

    expect(result.err).toBeTruthy();

    if (result.err) {
      expect(result.val).toBeInstanceOf(DrupalkitJsonApiError);
      expect(result.val.statusCode).toBe(400);
    }
  });
});
