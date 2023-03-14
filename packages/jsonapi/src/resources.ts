import { DrupalJsonApiParamsInterface } from "drupal-jsonapi-params";
import { LinkObject, ResourceObject, Response } from "ts-json-api";

/* eslint-disable jsdoc/require-description-complete-sentence */
/* eslint-disable @typescript-eslint/no-empty-interface */

/**
 * Interface describing all valid JSON:API resources for the .resource()
 * method.
 *
 * This interface is meant to be augmented via declaration merging
 * in your own code!
 *
 * Below is an example of how the interface is expected to be used.
 * The key is a string literal of the entity type and bundle type separated
 * by double dashes.
 *
 * The value is a object with the following properties:
 *   - `resource`: Type of the JSON:API resource object.
 *   - `operations`: Union of string literals of allowed operations.
 *
 * The resource type MUST extend the `ResourceObject` interface from the
 * `ts-json-api` package.
 *
 * Valid operations:
 *   - readSingle
 *   - readMany
 *   - create
 *   - update
 *   - delete
 *
 * @example
 * ```ts
 * declare module "@drupal-kit/jsonapi" {
 *   interface JsonApiResources {
 *     "file--file": {
 *       resource: FileResource;
 *       operations: "readSingle" | "readMany" | "create" | "update" | "delete";
 *     }
 *   }
 * }
 * ```
 */
export interface JsonApiResources {}

export interface JsonApiIndex extends Response<[]> {
  links: {
    [type: string]: LinkObject;
  };
}

/**
 * Utility types.
 */

/**
 * Extract the create payload type from a resource object.
 */
type ResourceCreatePayload<R extends ResourceObject> = {
  data: Pick<R, "type" | "attributes" | "relationships"> &
    Partial<Pick<R, "id">>;
};

/**
 * Extract the update payload type from a resource object.
 */
type ResourceUpdatePayload<R extends ResourceObject> = {
  data: Pick<R, "id" | "type"> & {
    attributes?: Partial<R["attributes"]>;
    relationships?: Partial<R["relationships"]>;
  };
};

/**
 * Parameters for various operations.
 */

type ReadParameters = {
  queryParams?: DrupalJsonApiParamsInterface;
};

export type ReadSingleParameters = ReadParameters & {
  uuid: string;
};

export type ReadManyParameters = ReadParameters;

export type CreateParameters<Resource extends ResourceObject> = {
  payload: ResourceCreatePayload<Resource>;
};

export type UpdateParameters<Resource extends ResourceObject> = {
  uuid: string;
  payload: ResourceUpdatePayload<Resource>;
};

export type DeleteParameters = {
  uuid: string;
};

/**
 * Infer correct parameters by operation and resource type.
 */
export type ToParameters<
  Operation,
  Resource extends ResourceObject,
> = "readSingle" extends Operation
  ? ReadSingleParameters
  : "readMany" extends Operation
  ? ReadManyParameters
  : "create" extends Operation
  ? CreateParameters<Resource>
  : "update" extends Operation
  ? UpdateParameters<Resource>
  : "delete" extends Operation
  ? DeleteParameters
  : never;

export type ToReturnType<
  Operation,
  Resource extends ResourceObject,
> = "readSingle" extends Operation
  ? ReadSingleParameters
  : "readMany" extends Operation
  ? ReadManyParameters
  : "create" extends Operation
  ? CreateParameters<Resource>
  : "update" extends Operation
  ? UpdateParameters<Resource>
  : "delete" extends Operation
  ? DeleteParameters
  : never;
