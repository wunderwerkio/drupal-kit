import { Result } from "@wunderwerk/ts-functional/results";
import { DrupalJsonApiParamsInterface } from "drupal-jsonapi-params";
import {
  Attributes,
  Link,
  LinkObject,
  Links,
  Meta,
  Relationship,
  ResourceObject,
  Response,
} from "ts-json-api";

import { DrupalkitJsonApiError } from "./DrupalkitJsonApiError.js";

/* eslint-disable jsdoc/require-description-complete-sentence */
/* eslint-disable @typescript-eslint/no-empty-interface */

/**
 * Defines the JSON:API resource type.
 *
 * Other types are derived from this type.
 * Define your drupal entities using this interface in your codebase.
 */
export interface JsonApiResource {
  type: string;
  id: string;
  attributes?: Attributes;
  relationships?: {
    [key: string]: JsonApiResource | JsonApiResource[];
  };
  links?: Links;
  meta?: Meta;
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
export interface JsonApiResources {}

/**
 * Defines all valid operations that can be made via the API.
 */
export type ValidOperation =
  | "readSingle"
  | "readMany"
  | "create"
  | "update"
  | "delete";

export type ResourceType = keyof JsonApiResources extends never
  ? string
  : keyof JsonApiResources;

export interface JsonApiIndex extends Response<[]> {
  links: {
    [type: string]: LinkObject;
  };
}

/**
 * Utility types.
 */

/**
 * The following types are used to derive a simple json api resource
 * object from a standard json api resource object.
 *
 * The resulting type matches the output produced by the
 * simplifyResourceResponse() method.
 */

type ExtractArrayElementType<T> = T extends Array<infer U> ? U : never;

type DeriveSimpleJsonApiResourceUnion<T> =
  T extends infer U extends JsonApiResource
    ? DeriveSimpleJsonApiResource<U>
    : never;

export type DeriveSimpleJsonApiResource<TResource extends JsonApiResource> = {
  id: TResource["id"];
  type: TResource["type"];
  resourceIdObjMeta: {
    [key in keyof TResource["meta"]]: TResource["meta"][key] extends Meta[0]
      ? TResource["meta"][key]
      : never;
  };
  links: {
    [key in keyof TResource["links"]]: TResource["links"][key] extends Link
      ? TResource["links"][key]
      : never;
  };
} & {
  [key in keyof TResource["attributes"]]: TResource["attributes"][key] extends Attributes[0]
    ? TResource["attributes"][key]
    : never;
} & {
  [key in keyof TResource["relationships"]]: TResource["relationships"][key] extends JsonApiResource
    ? DeriveSimpleJsonApiResource<TResource["relationships"][key]>
    : TResource["relationships"][key] extends JsonApiResource[]
    ? DeriveSimpleJsonApiResourceUnion<
        ExtractArrayElementType<TResource["relationships"][key]>
      >[]
    : never;
};

/**
 * The following types are used to derive a ts-json-api resource
 * object from a standard json api resource object.
 */

type DeriveResourceObjectUnion<T> = T extends infer U extends JsonApiResource
  ? DeriveResourceObject<U>
  : never;

export type DeriveResourceObject<TResource extends JsonApiResource> = {
  type: TResource["type"];
  id: TResource["id"];
  attributes: {
    [key in keyof TResource["attributes"]]: TResource["attributes"][key] extends Attributes[0]
      ? TResource["attributes"][key]
      : never;
  };
  meta: {
    [key in keyof TResource["meta"]]: TResource["meta"][key] extends Meta[0]
      ? TResource["meta"][key]
      : never;
  };
  links: {
    [key in keyof TResource["links"]]: TResource["links"][key] extends Link
      ? TResource["links"][key]
      : never;
  };
  relationships: {
    [key in keyof TResource["relationships"]]: TResource["relationships"][key] extends JsonApiResource
      ? Relationship<DeriveResourceObject<TResource["relationships"][key]>>
      : TResource["relationships"][key] extends JsonApiResource[]
      ? Relationship<
          DeriveResourceObjectUnion<
            ExtractArrayElementType<TResource["relationships"][key]>
          >[]
        >
      : never;
  };
};

/**
 * Creates a simple json api resource from a resource object.
 *
 * Supports both single and an array of resource objects.
 */
export type SimpleFromResourceObject<T> = T extends DeriveResourceObject<
  infer TResource
>
  ? DeriveSimpleJsonApiResource<TResource>
  : T extends DeriveResourceObject<infer TResource>[]
  ? DeriveSimpleJsonApiResource<TResource>[]
  : never;

/**
 * Extract the create payload type from a resource object.
 */
type ResourceCreatePayload<
  R extends JsonApiResource,
  TResourceObject extends DeriveResourceObject<R> = DeriveResourceObject<R>,
> = {
  id?: TResourceObject["id"];
  type?: TResourceObject["type"];
  attributes?: Partial<TResourceObject["attributes"]>;
  relationships?: Partial<TResourceObject["relationships"]>;
};
/**
 * Extract the update payload type from a resource object.
 */
type ResourceUpdatePayload<R extends JsonApiResource> = object & {
  type?: R["type"];
  attributes?: Partial<R["attributes"]>;
  relationships?: Partial<R["relationships"]>;
};

export type ResourceResponse<
  T extends ResourceObject | ResourceObject[],
  TResource extends JsonApiResource,
> = Response<T> & {
  toSimpleResource: () => DeriveSimpleJsonApiResource<TResource>;
};

export type ResourceResult<
  TResource extends JsonApiResource,
  TReturnSimple extends boolean,
> = Result<
  TReturnSimple extends true
    ? DeriveSimpleJsonApiResource<TResource>
    : Response<DeriveResourceObject<TResource>>,
  DrupalkitJsonApiError
>;

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

export type CreateParameters<Resource extends JsonApiResource> = {
  payload: ResourceCreatePayload<Resource>;
};

export type UpdateParameters<Resource extends JsonApiResource> = {
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
  Resource extends JsonApiResource,
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
