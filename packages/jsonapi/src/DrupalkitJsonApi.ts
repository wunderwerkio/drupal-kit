import { Result } from "@wunderwerk/ts-functional/results";
import { Jsona } from "jsona";
import { Response } from "ts-json-api";
import { Drupalkit, DrupalkitOptions, Query } from "@drupal-kit/core";
import { RequestHeaders } from "@drupal-kit/types";

import { DrupalkitJsonApiError } from "./DrupalkitJsonApiError.js";
import {
  CreateParameters,
  DeleteParameters,
  DeriveResourceObject,
  JsonApiIndex,
  JsonApiResource,
  JsonApiResources,
  ReadManyParameters,
  ReadSingleParameters,
  ResourceType,
  SimpleFromResourceObject,
  ToParameters,
  UpdateParameters,
  ValidOperation,
} from "./resources.js";
import { isJsonApiRequest } from "./utils.js";

declare module "@drupal-kit/core" {
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
  const defaultHeaders: RequestHeaders = {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
  };

  const serializer = new Jsona();

  /**
   * Retrieves the JSON:API index.
   *
   * @returns A result object containing the JSON:API index or an error.
   */
  const getIndex = async (): Promise<
    Result<JsonApiIndex, DrupalkitJsonApiError>
  > => {
    const url = buildJsonApiUrl("");

    const result = await drupalkit.request<JsonApiIndex>(url, {
      method: "GET",
      headers: {
        ...defaultHeaders,
      },
    });

    if (result.err) {
      return Result.Err(DrupalkitJsonApiError.fromDrupalkitError(result.val));
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Get menu items for given menu.
   *
   * @param menu - System name of the menu.
   */
  const getMenuItems = async (menu: string) => {
    return await getResourceCollection(
      "drupalkit_internal--menu_items",
      {},
      {
        path: `menu_items/${menu}`,
      },
    );
  };

  /**
   * Retrieves a single JSON:API resource object.
   *
   * @param type - The type of resource object to retrieve.
   * @param parameters - The parameters to use for the query.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @param options.localeOverride - An optional override for the locale.
   * @returns A result object containing the resource object or an error.
   */
  const getResource = async <
    R extends JsonApiResource,
    TResourceObject extends DeriveResourceObject<R> = DeriveResourceObject<R>,
  >(
    type: ResourceType,
    parameters: ReadSingleParameters,
    options?: {
      path?: string;
      localeOverride?: string;
    },
  ): Promise<Result<Response<TResourceObject>, DrupalkitJsonApiError>> => {
    const path =
      options?.path ?? type.replace("--", "/") + "/" + parameters.uuid;

    const url = buildJsonApiUrl(path, {
      ...options,
      query: parameters.queryParams?.getQueryObject(),
    });

    const result = await drupalkit.request<Response<TResourceObject>>(url, {
      method: "GET",
      headers: defaultHeaders,
    });

    if (result.err) {
      return Result.Err(DrupalkitJsonApiError.fromDrupalkitError(result.val));
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Simplified the given resource response (single or many).
   *
   * Related entities which are included in the response are embedded
   * into the resulting resource object.
   *
   * @param data - The resource response to simplify.
   */
  const simplifyResourceResponse = <
    R extends JsonApiResource,
    TResourceObject extends DeriveResourceObject<R> | DeriveResourceObject<R>[],
    TSimpleResource extends SimpleFromResourceObject<TResourceObject>,
  >(
    data: Response<TResourceObject>,
  ): TSimpleResource => {
    return serializer.deserialize(JSON.stringify(data)) as TSimpleResource;
  };

  /**
   * Retrieves multiple JSON:API resource objects.
   *
   * @param type - The type of resource object to retrieve.
   * @param parameters - The parameters to use for the query.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @param options.localeOverride - An optional override for the locale.
   * @returns A result object containing the resource object or an error.
   */
  const getResourceCollection = async <
    R extends JsonApiResource,
    TResourceObject extends DeriveResourceObject<R> = DeriveResourceObject<R>,
  >(
    type: ResourceType,
    parameters: ReadManyParameters,
    options?: {
      path?: string;
      localeOverride?: string;
    },
  ): Promise<Result<Response<TResourceObject[]>, DrupalkitJsonApiError>> => {
    const path = options?.path ?? type.replace("--", "/");

    const url = buildJsonApiUrl(path, {
      ...options,
      query: parameters.queryParams?.getQueryObject(),
    });

    const result = await drupalkit.request<Response<TResourceObject[]>>(url, {
      method: "GET",
      headers: defaultHeaders,
    });

    if (result.err) {
      return Result.Err(DrupalkitJsonApiError.fromDrupalkitError(result.val));
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Create a JSON:API resource.
   *
   * @param type - The type of resource object to create.
   * @param parameters - The parameters to use for the request.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @param options.localeOverride - An optional override for the locale.
   * @returns A result object containing the resource object or an error.
   */
  const createResource = async <
    R extends JsonApiResource,
    TResourceObject extends DeriveResourceObject<R> = DeriveResourceObject<R>,
  >(
    type: ResourceType,
    parameters: CreateParameters<R>,
    options?: {
      path?: string;
      localeOverride?: string;
    },
  ): Promise<Result<Response<TResourceObject>, DrupalkitJsonApiError>> => {
    const path = options?.path ?? type.replace("--", "/");

    const url = buildJsonApiUrl(path, options);

    // Set the type if not already set.
    if (!parameters.payload.type) {
      parameters.payload.type = type;
    }

    const result = await drupalkit.request<Response<TResourceObject>>(url, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        data: parameters.payload,
      }),
    });

    if (result.err) {
      return Result.Err(DrupalkitJsonApiError.fromDrupalkitError(result.val));
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Update a JSON:API resource.
   *
   * @param type - The type of resource object to update.
   * @param parameters - The parameters to use for the request.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @param options.localeOverride - An optional override for the locale.
   * @returns A result object containing the resource object or an error.
   */
  const updateResource = async <
    R extends JsonApiResource,
    TResourceObject extends DeriveResourceObject<R> = DeriveResourceObject<R>,
  >(
    type: ResourceType,
    parameters: UpdateParameters<R>,
    options?: {
      path?: string;
      localeOverride?: string;
    },
  ): Promise<Result<Response<TResourceObject>, DrupalkitJsonApiError>> => {
    const path =
      options?.path ?? type.replace("--", "/") + "/" + parameters.uuid;

    const url = buildJsonApiUrl(path, options);

    parameters.payload.id = parameters.uuid;

    // Set the type if not already set.
    if (!parameters.payload.type) {
      parameters.payload.type = type;
    }

    const result = await drupalkit.request<Response<TResourceObject>>(url, {
      method: "PATCH",
      headers: defaultHeaders,
      body: JSON.stringify({ data: parameters.payload }),
    });

    if (result.err) {
      return Result.Err(DrupalkitJsonApiError.fromDrupalkitError(result.val));
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Delete a JSON:API resource.
   *
   * @param type - The type of resource object to delete.
   * @param parameters - The parameters to use for the request.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @returns A result object containing the resource object or an error.
   */
  const deleteResource = async (
    type: ResourceType,
    parameters: DeleteParameters,
    options?: {
      path?: string;
    },
  ): Promise<Result<true, DrupalkitJsonApiError>> => {
    const path =
      options?.path ?? type.replace("--", "/") + "/" + parameters.uuid;

    const url = buildJsonApiUrl(path);

    const result = await drupalkit.request(url, {
      method: "DELETE",
      headers: defaultHeaders,
    });

    if (result.err) {
      return Result.Err(DrupalkitJsonApiError.fromDrupalkitError(result.val));
    }

    return Result.Ok(true as const);
  };

  /**
   * Constructs a JSON API URL for use with Drupal.
   *
   * @param path - The path to the JSON API endpoint.
   * @param options - An optional object containing additional options.
   * @param options.localeOverride - An optional override for the locale.
   * @param options.query - An optional object containing query parameters.
   * @returns The constructed URL as a string.
   */
  const buildJsonApiUrl = (
    path: string,
    options?: {
      localeOverride?: string;
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
      simplifyResourceResponse,
      getMenuItems,
      async resource<
        Type extends keyof JsonApiResources,
        Resource extends JsonApiResources[Type]["resource"],
        Operation extends JsonApiResources[Type]["operations"],
        Params extends ToParameters<Operation, Resource>,
        Return extends Record<
          Operation,
          "readSingle" extends Operation
            ? Awaited<ReturnType<typeof getResource<Resource>>>
            : "readMany" extends Operation
            ? Awaited<ReturnType<typeof getResourceCollection<Resource>>>
            : "create" extends Operation
            ? Awaited<ReturnType<typeof createResource<Resource>>>
            : "update" extends Operation
            ? Awaited<ReturnType<typeof updateResource<Resource>>>
            : "delete" extends Operation
            ? Awaited<ReturnType<typeof deleteResource>>
            : Result<never, Error>
        >,
      >(
        type: Type,
        operation: Operation,
        parameters: Params,
        options?: {
          localeOverride?: string;
        },
      ): Promise<Return[Operation]> {
        switch (operation as ValidOperation) {
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

          case "create":
            return (await createResource(
              type,
              parameters as CreateParameters<Resource>,
              options,
            )) as Return[Operation];

          case "update":
            return (await updateResource(
              type,
              parameters as UpdateParameters<Resource>,
              options,
            )) as Return[Operation];

          case "delete":
            return (await deleteResource(
              type,
              parameters as DeleteParameters,
            )) as Return[Operation];

          default:
            return Result.Err(
              new Error(`Unknown operation "${operation}"`),
            ) as Return[Operation];
        }
      },
    },
  };
};
