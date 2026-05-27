import { Result } from "@wunderwerk/ts-functional/results";
import { Jsona } from "jsona";
import { Response } from "ts-json-api";
import { Drupalkit, DrupalkitOptions, Query } from "@drupal-kit/core";
import { OverrideableRequestOptions, RequestHeaders } from "@drupal-kit/types";

import { DrupalkitJsonApiError } from "./DrupalkitJsonApiError.js";
import {
  CreateParameters,
  DeleteParameters,
  DerivedFileResource,
  DeriveResourceObject,
  FileRelationshipKeys,
  JsonApiIndex,
  JsonApiResource,
  JsonApiResourceOperationResult,
  JsonApiResources,
  MenuLinkContentResource,
  ReadManyParameters,
  ReadSingleParameters,
  ResourceType,
  SimpleFromResourceObject,
  ToParameters,
  UpdateParameters,
  ValidOperation,
  WithPaginationLinks,
} from "./resources.js";
import {
  isJsonApiRequest,
  isJsonApiResponse,
  sanitizeFilename,
} from "./utils.js";

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
   * @param requestOptions - Optional request options.
   *
   * @returns A result object containing the JSON:API index or an error.
   */
  const getIndex = async (
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<JsonApiIndex, DrupalkitJsonApiError>> => {
    const url = buildJsonApiUrl("");

    const result = await drupalkit.request<JsonApiIndex>(
      url,
      {
        method: "GET",
        headers: {
          ...defaultHeaders,
        },
      },
      requestOptions,
    );

    if (result.err) {
      return Result.Err(DrupalkitJsonApiError.fromDrupalkitError(result.val));
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Get menu items for given menu.
   *
   * @param menu - System name of the menu.
   * @param requestOptions - Optional request options.
   */
  const getMenuItems = async (
    menu: string,
    requestOptions?: OverrideableRequestOptions,
  ) => {
    return await getResourceCollection<MenuLinkContentResource>(
      "drupalkit_internal--menu_items",
      {},
      requestOptions,
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
   * @param requestOptions - Optional request options.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @returns A result object containing the resource object or an error.
   */
  const getResource = async <
    TResource extends JsonApiResource,
    TResourceObject extends
      DeriveResourceObject<TResource> = DeriveResourceObject<TResource>,
  >(
    type: ResourceType,
    parameters: ReadSingleParameters,
    requestOptions?: OverrideableRequestOptions,
    options?: {
      path?: string;
    },
  ): Promise<Result<Response<TResourceObject>, DrupalkitJsonApiError>> => {
    const path =
      options?.path ?? type.replace("--", "/") + "/" + parameters.uuid;

    const url = buildJsonApiUrl(path, {
      localeOverride: requestOptions?.locale,
      query: buildReadQuery(parameters),
    });

    const result = await drupalkit.request<Response<TResourceObject>>(
      url,
      {
        method: "GET",
        headers: defaultHeaders,
      },
      requestOptions,
    );

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
    TResource extends JsonApiResource,
    TResourceObject extends
      | DeriveResourceObject<TResource>
      | DeriveResourceObject<TResource>[],
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
   * @param requestOptions - Optional request options.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @returns A result object containing the resource object or an error.
   */
  const getResourceCollection = async <
    TResource extends JsonApiResource,
    TResourceObject extends
      DeriveResourceObject<TResource> = DeriveResourceObject<TResource>,
  >(
    type: ResourceType,
    parameters: ReadManyParameters,
    requestOptions?: OverrideableRequestOptions,
    options?: {
      path?: string;
    },
  ): Promise<
    Result<
      WithPaginationLinks<Response<TResourceObject[]>>,
      DrupalkitJsonApiError
    >
  > => {
    const path = options?.path ?? type.replace("--", "/");

    const url = buildJsonApiUrl(path, {
      localeOverride: requestOptions?.locale,
      query: buildReadQuery(parameters),
    });

    const result = await drupalkit.request<Response<TResourceObject[]>>(
      url,
      {
        method: "GET",
        headers: defaultHeaders,
      },
      requestOptions,
    );

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
   * @param requestOptions - Optional request options.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @returns A result object containing the resource object or an error.
   */
  const createResource = async <
    TResource extends JsonApiResource,
    TResourceObject extends
      DeriveResourceObject<TResource> = DeriveResourceObject<TResource>,
  >(
    type: ResourceType,
    parameters: CreateParameters<TResource>,
    requestOptions?: OverrideableRequestOptions,
    options?: {
      path?: string;
    },
  ): Promise<Result<Response<TResourceObject>, DrupalkitJsonApiError>> => {
    const path = options?.path ?? type.replace("--", "/");

    const url = buildJsonApiUrl(path, {
      localeOverride: requestOptions?.locale,
    });

    // Set the type if not already set.
    if (!parameters.payload.type) {
      parameters.payload.type = type;
    }

    const result = await drupalkit.request<Response<TResourceObject>>(
      url,
      {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          data: parameters.payload,
        }),
      },
      requestOptions,
    );

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
   * @param requestOptions - Optional request options.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @returns A result object containing the resource object or an error.
   */
  const updateResource = async <
    TResource extends JsonApiResource,
    TResourceObject extends
      DeriveResourceObject<TResource> = DeriveResourceObject<TResource>,
  >(
    type: ResourceType,
    parameters: UpdateParameters<TResource>,
    requestOptions?: OverrideableRequestOptions,
    options?: {
      path?: string;
    },
  ): Promise<Result<Response<TResourceObject>, DrupalkitJsonApiError>> => {
    const path =
      options?.path ?? type.replace("--", "/") + "/" + parameters.uuid;

    const url = buildJsonApiUrl(path, {
      localeOverride: requestOptions?.locale,
    });

    parameters.payload.id = parameters.uuid;

    // Set the type if not already set.
    if (!parameters.payload.type) {
      parameters.payload.type = type;
    }

    const result = await drupalkit.request<Response<TResourceObject>>(
      url,
      {
        method: "PATCH",
        headers: defaultHeaders,
        body: JSON.stringify({ data: parameters.payload }),
      },
      requestOptions,
    );

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
   * @param requestOptions - Optional request options.
   * @param options - Optional settings to override locale and default locale.
   * @param options.path - An optional override for the request path.
   * @returns A result object containing the resource object or an error.
   */
  const deleteResource = async (
    type: ResourceType,
    parameters: DeleteParameters,
    requestOptions?: OverrideableRequestOptions,
    options?: {
      path?: string;
    },
  ): Promise<Result<true, DrupalkitJsonApiError>> => {
    const path =
      options?.path ?? type.replace("--", "/") + "/" + parameters.uuid;

    const url = buildJsonApiUrl(path);

    const result = await drupalkit.request(
      url,
      {
        method: "DELETE",
        headers: defaultHeaders,
      },
      requestOptions,
    );

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

  const buildReadQuery = (
    parameters: ReadSingleParameters | ReadManyParameters,
  ) => {
    return {
      ...parameters.queryParams?.getQueryObject(),
      ...(parameters.pagination ? { page: parameters.pagination } : {}),
    };
  };

  /**
   * Upload a file to an entity's file relationship field.
   *
   * @param type - Entity type (e.g. "node--article").
   * @param uuid - Entity uuid.
   * @param fieldName - File relationship field name.
   * @param file - File or Blob to upload.
   * @param filenameWithExt - Filename with extension.
   * @param requestOptions - Optional request options.
   */
  const uploadFile = async <
    TType extends keyof JsonApiResources,
    TField extends FileRelationshipKeys<TType>,
    TFileResource extends
      JsonApiResources[TType]["resource"]["relationships"][TField],
  >(
    type: TType,
    uuid: string,
    fieldName: TField,
    file: File | Blob,
    filenameWithExt: string,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<
    Result<Response<DerivedFileResource<TFileResource>>, DrupalkitJsonApiError>
  > => {
    const sanitizedFilename = sanitizeFilename(filenameWithExt);
    const path =
      (type as string).replace("--", "/") +
      "/" +
      uuid +
      "/" +
      String(fieldName);
    const url = buildJsonApiUrl(path, {
      localeOverride: requestOptions?.locale,
    });

    if (!filenameWithExt.includes(".") || filenameWithExt.endsWith(".")) {
      return Result.Err(
        new DrupalkitJsonApiError(
          "Filename must include a file extension",
          400,
          {
            request: {
              url,
              baseUrl: drupalkitOptions.baseUrl,
              method: "POST",
              headers: {},
            },
          },
        ),
      );
    }

    const result = await drupalkit.request<
      Response<DerivedFileResource<TFileResource>>
    >(
      url,
      {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `file; filename="${sanitizedFilename}"`,
        },
      },
      requestOptions,
    );

    if (result.err) {
      return Result.Err(DrupalkitJsonApiError.fromDrupalkitError(result.val));
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Create DrupalkitJsonApiError for JSON:API failed requests.
   */
  drupalkit.hook.error("request", (error) => {
    // Throw DrupalkitJsonApiError if either the request or response uses JSON:API content-type.
    if (isJsonApiRequest(error.request) || isJsonApiResponse(error.response)) {
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
      uploadFile,
      async resource<
        TType extends keyof JsonApiResources,
        TResource extends JsonApiResources[TType]["resource"],
        TOperation extends JsonApiResources[TType]["operations"],
        TParams extends ToParameters<TOperation, TResource>,
      >(
        type: TType,
        operation: TOperation,
        parameters: TParams,
        requestOptions?: OverrideableRequestOptions,
      ): Promise<JsonApiResourceOperationResult<TResource, TOperation>> {
        switch (operation as ValidOperation) {
          case "readSingle":
            return (await getResource(
              type,
              parameters as ReadSingleParameters,
              requestOptions,
            )) as JsonApiResourceOperationResult<TResource, TOperation>;

          case "readMany":
            return (await getResourceCollection(
              type,
              parameters as ReadManyParameters,
              requestOptions,
            )) as JsonApiResourceOperationResult<TResource, TOperation>;

          case "create":
            return (await createResource(
              type,
              parameters as CreateParameters<TResource>,
              requestOptions,
            )) as JsonApiResourceOperationResult<TResource, TOperation>;

          case "update":
            return (await updateResource(
              type,
              parameters as UpdateParameters<TResource>,
              requestOptions,
            )) as JsonApiResourceOperationResult<TResource, TOperation>;

          case "delete":
            return (await deleteResource(
              type,
              parameters as DeleteParameters,
              requestOptions,
            )) as JsonApiResourceOperationResult<TResource, TOperation>;

          default:
            return Result.Err(
              new Error(`Unknown operation "${operation}"`),
            ) as JsonApiResourceOperationResult<TResource, TOperation>;
        }
      },
    },
  };
};
