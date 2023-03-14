import { DrupalJsonApiParamsInterface } from "drupal-jsonapi-params";
import {
  LinkObject,
  Relationship,
  ResourceObject,
  Response,
} from "ts-json-api";

export interface JsonApiIndex extends Response<[]> {
  links: {
    [type: string]: LinkObject;
  };
}

type ResourceCreatePayload<R extends ResourceObject> = {
  data: Pick<R, "type" | "attributes" | "relationships"> &
    Partial<Pick<R, "id">>;
};

type ResourceUpdatePayload<R extends ResourceObject> = {
  data: Pick<R, "id" | "type"> & {
    attributes?: Partial<R["attributes"]>;
    relationships?: Partial<R["relationships"]>;
  };
};

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



























interface FileResource extends ResourceObject {
  type: "file--file";
  attributes: {
    langcode: string;
    filename: string;
    uri: {
      value: string;
      url: string;
    };
    filemime: string;
    filesize: number;
    status: boolean;
    created: string;
    changed: string;
  };
  relationships: {
    uid: Relationship<UserResource>;
  };
}

interface UserResource extends ResourceObject {
  type: "user--user";
  attributes: {
    field_firstname: string;
    field_lastname: string;
    created: string;
    changed: string;
  };
}


export interface JsonApiResources {
  "file--file": {
    resource: FileResource;
    operations: "readSingle" | "readMany" | "create" | "update" | "delete";
  };
}
