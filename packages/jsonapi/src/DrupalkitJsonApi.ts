import { ResourceObject, Response } from "ts-json-api";
import { Err, Ok } from "ts-results";
import { Drupalkit, DrupalkitOptions, Query } from "@drupalkit/core";

import { DrupalkitJsonApiError } from "./DrupalkitJsonApiError";
import {
  JsonApiIndex,
  JsonApiResources,
  ReadManyParameters,
  ReadSingleParameters,
  ToParameters,
} from "./resources.js";
import { isJsonApiRequest } from "./utils";

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
   * Create DrupalkitJsonApiError for JSON:API failed requests.
   */
  drupalkit.hook.error("request", (error) => {
    // Only care about JSON:API requests.
    if (isJsonApiRequest(error.request)) {
      throw DrupalkitJsonApiError.fromDrupalkitError(error);
    }

    throw error;
  });

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
        Return extends Record<
          Operation,
          "readSingle" extends Operation
          ? Awaited<ReturnType<typeof getResource>>
          : "readMany" extends Operation
          ? Awaited<ReturnType<typeof getResourceCollection>>
          : Err<Error>
        >,
      >(
        type: Type,
        operation: Operation,
        parameters: Params,
        options?: {
          localeOverride?: string;
          defaultLocaleOverride?: string;
        },
      ): Promise<Return[Operation]> {
        switch (operation) {
          case "readSingle":
            return (await getResource(
              type,
              parameters as ReadSingleParameters,
              options,
            )) as Return[Operation];

          case "readMany":
            return (await getResourceCollection(
              type,
              parameters as ReadManyParameters,
              options,
            )) as Return[Operation];
        }

        return Err(
          new Error(`Unknown operation "${operation}"`),
        ) as Return[Operation];
      },
    },
  };
};
