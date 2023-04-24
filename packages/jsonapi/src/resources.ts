import { DrupalJsonApiParamsInterface } from "drupal-jsonapi-params";
import { LinkObject, ResourceObject, Response } from "ts-json-api";

/* eslint-disable jsdoc/require-description-complete-sentence */
/* eslint-disable @typescript-eslint/no-empty-interface */

/**
 * This interface describes the type that the JSON:API resource definition
 * must implement.
 *
 * This type is only used to typecheck the user's module augmentation
 * (see below.)
 *
 * The index signature is removed later on.
 */
interface JsonApiResourcesBase {
  [key: string]: {
    resource: ResourceObject;
    operations: ValidOperation;
  };
}

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
 * The value can be defined with the `JsonApiResourceDefinition` utility type.
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
 *     };
 *     "node--readonly": {
 *       resource: NodeResource;
 *       operations: "readSingle" | "readMany";
 *     };
 *   }
 * }
 * ```
 */
export interface JsonApiResources extends JsonApiResourcesBase { }

/**
 * This type is used in the plugin to access the JsonApiResources
 * interface without the index signature from the base interface.
 */
export type NarrowedJsonApiResources = RemoveIndex<JsonApiResources>;

/**
 * Defines all valid operations that can be made via the API.
 */
export type ValidOperation =
  | "readSingle"
  | "readMany"
  | "create"
  | "update"
  | "delete";

export type ResourceType = keyof NarrowedJsonApiResources extends never
  ? string
  : keyof NarrowedJsonApiResources;

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
  id?: R["id"];
  type?: R["type"];
  attributes?: Partial<R["attributes"]>;
  relationships?: Partial<R["relationships"]>;
}
/**
 * Extract the update payload type from a resource object.
 */
type ResourceUpdatePayload<R extends ResourceObject> = object & {
  type?: R["type"];
  attributes?: Partial<R["attributes"]>;
  relationships?: Partial<R["relationships"]>;
};

/**
 * Remove index signature from T.
 *
 * @see https://stackoverflow.com/questions/51465182/how-to-remove-index-signature-using-mapped-types
 */
export type RemoveIndex<T> = {
  [key in keyof T as string extends key
  ? never
  : number extends key
  ? never
  : key]: T[key];
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
