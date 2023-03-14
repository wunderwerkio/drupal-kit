import { ResourceObject, Response } from "ts-json-api";
import { Ok } from "ts-results";
import { Drupalkit, DrupalkitOptions, Query } from "@drupalkit/core";

import {
  JsonApiIndex,
  JsonApiResources,
  ReadManyParameters,
  ReadSingleParameters,
  ToParameters,
} from "./resources.js";

declare module "@drupalkit/core" {
  interface DrupalkitOptions {
    jsonApiPrefix?: string;
  }
}

/**
 * Drupalkit plugin that provides integration with the Drupal JSON:API.
 *
 * @param drupalkit - The Drupalkit instance.
 * @param drupalkitOptions - The options for the Drupalkit instance.
 */
export const DrupalkitJsonApi = (
  drupalkit: Drupalkit,
  drupalkitOptions: DrupalkitOptions,
) => {
  const defaultHeaders: HeadersInit = {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
  };

  /**
   * Retrieves the JSON:API index.
   *
   * @returns A result object containing the JSON:API index or an error.
   */
  const getIndex = async () => {
    const url = buildJsonApiUrl("");

    const response = await drupalkit.request<JsonApiIndex>(url, {
      method: "GET",
      headers: {
        ...defaultHeaders,
      },
    });

    if (response.err) {
      return response;
    }

    return Ok(response.val.data);
  };

  /**
   * Retrieves a single JSON:API resource object.
   *
   * @param type - The type of resource object to retrieve.
   * @param parameters - The parameters to use for the query.
   * @param options - Optional settings to override locale and default locale.
   * @param options.localeOverride - An optional override for the locale.
   * @param options.defaultLocaleOverride - An optional override for the default locale.
   * @returns A result object containing the resource object or an error.
   */
  const getResource = async <R extends ResourceObject>(
    type: R["type"],
    parameters: ReadSingleParameters,
    options?: {
      localeOverride?: string;
      defaultLocaleOverride?: string;
    },
  ) => {
    const path = type.replace("--", "/") + "/" + parameters.uuid;

    const url = buildJsonApiUrl(path, {
      ...options,
      query: parameters.queryParams?.getQueryObject(),
    });

    const result = await drupalkit.request<Response<R>>(url, {
      method: "GET",
      headers: defaultHeaders,
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
  };

  /**
   * Retrieves multiple JSON:API resource objects.
   *
   * @param type - The type of resource object to retrieve.
   * @param parameters - The parameters to use for the query.
   * @param options - Optional settings to override locale and default locale.
   * @returns A result object containing the resource object or an error.
   */
  const getResourceCollection = async <R extends ResourceObject>(
    type: R["type"],
    parameters: ReadManyParameters,
    options?: {
      localeOverride?: string;
      defaultLocaleOverride?: string;
    },
  ) => {
    const path = type.replace("--", "/");

    const url = buildJsonApiUrl(path, {
      ...options,
      query: parameters.queryParams?.getQueryObject(),
    });

    const result = await drupalkit.request<Response<R[]>>(url, {
      method: "GET",
      headers: defaultHeaders,
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
  };

  /**
   * Constructs a JSON API URL for use with Drupal.
   *
   * @param path - The path to the JSON API endpoint.
   * @param options - An optional object containing additional options.
   * @param options.localeOverride - An optional override for the locale.
   * @param options.defaultLocaleOverride - An optional override for the default locale.
   * @returns The constructed URL as a string.
   */
  const buildJsonApiUrl = (
    path: string,
    options?: {
      localeOverride?: string;
      defaultLocaleOverride?: string;
      query?: Query;
    },
  ) => {
    const prefix = drupalkitOptions.jsonApiPrefix ?? "jsonapi";

    return drupalkit.buildUrl(path, {
      ...options,
      customPrefix: prefix,
    });
  };

  /**
   * Extend the Drupalkit instance.
   */
  return {
    jsonApi: {
      buildJsonApiUrl,
      getIndex,
      async resource<
        Type extends keyof JsonApiResources,
        Resource extends JsonApiResources[Type]["resource"],
        Operation extends JsonApiResources[Type]["operations"],
        Params extends ToParameters<Operation, Resource>,
      >(
        type: Type,
        operation: Operation,
        parameters: Params,
        options?: {
          localeOverride?: string;
          defaultLocaleOverride?: string;
        },
      ) {
        switch (operation) {
          case "readSingle":
            return getResource(
              type,
              parameters as ReadSingleParameters,
              options,
            );
          case "readMany":
            return getResourceCollection(
              type,
              parameters as ReadManyParameters,
              options,
            );
        }
      },
    },
  };
};
