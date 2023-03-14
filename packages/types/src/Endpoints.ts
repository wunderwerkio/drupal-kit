import { DrupalkitResponse } from "./DrupalkitResponse";
import { RequestHeaders } from "./RequestHeaders";
import { RequestOptions } from "./RequestOptions";
import { paths } from "./schema";

// https://stackoverflow.com/a/50375286/206879
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type ExtractParameters<T> = "parameters" extends keyof T
  ? UnionToIntersection<
      {
        [K in keyof T["parameters"]]: T["parameters"][K];
      }[keyof T["parameters"]]
    >
  : {};
type ExtractRequestBody<T> = "requestBody" extends keyof T
  ? "content" extends keyof T["requestBody"]
    ? "application/json" extends keyof T["requestBody"]["content"]
      ? T["requestBody"]["content"]["application/json"]
      : {
          data: {
            [K in keyof T["requestBody"]["content"]]: T["requestBody"]["content"][K];
          }[keyof T["requestBody"]["content"]];
        }
    : "application/json" extends keyof T["requestBody"]
    ? T["requestBody"]["application/json"]
    : {
        data: {
          [K in keyof T["requestBody"]]: T["requestBody"][K];
        }[keyof T["requestBody"]];
      }
  : {};
type ToDrupalkitParameters<T> = ExtractParameters<T> & ExtractRequestBody<T>;

type RequiredPreview<T> = T extends string
  ? {
      mediaType: {
        previews: [T, ...string[]];
      };
    }
  : {};

type Operation<
  Url extends keyof paths,
  Method extends keyof paths[Url],
  preview = unknown,
> = {
  parameters: ToDrupalkitParameters<paths[Url][Method]> &
    RequiredPreview<preview>;
  request: {
    method: Method extends keyof MethodsMap ? MethodsMap[Method] : never;
    url: Url;
    headers: RequestHeaders;
    request: RequestOptions;
  };
  response: ExtractDrupalkitResponse<paths[Url][Method]>;
};

type MethodsMap = {
  delete: "DELETE";
  get: "GET";
  patch: "PATCH";
  post: "POST";
  put: "PUT";
};
type SuccessStatuses = 200 | 201 | 202 | 204;
type RedirectStatuses = 301 | 302;
type EmptyResponseStatuses = 201 | 204;
type KnownJsonResponseTypes = "application/json" | "application/vnd.api+json";

type SuccessResponseDataType<Responses> = {
  [K in SuccessStatuses & keyof Responses]: GetContentKeyIfPresent<
    Responses[K]
  > extends never
    ? never
    : DrupalkitResponse<GetContentKeyIfPresent<Responses[K]>, K>;
}[SuccessStatuses & keyof Responses];
type RedirectResponseDataType<Responses> = {
  [K in RedirectStatuses & keyof Responses]: DrupalkitResponse<unknown, K>;
}[RedirectStatuses & keyof Responses];
type EmptyResponseDataType<Responses> = {
  [K in EmptyResponseStatuses & keyof Responses]: DrupalkitResponse<never, K>;
}[EmptyResponseStatuses & keyof Responses];

type GetContentKeyIfPresent<T> = "content" extends keyof T
  ? DataType<T["content"]>
  : DataType<T>;
type DataType<T> = {
  [K in KnownJsonResponseTypes & keyof T]: T[K];
}[KnownJsonResponseTypes & keyof T];
type ExtractDrupalkitResponse<R> = "responses" extends keyof R
  ? SuccessResponseDataType<R["responses"]> extends never
    ? RedirectResponseDataType<R["responses"]> extends never
      ? EmptyResponseDataType<R["responses"]>
      : RedirectResponseDataType<R["responses"]>
    : SuccessResponseDataType<R["responses"]>
  : unknown;

export interface Endpoints {
  "GET /jsonapi": Operation<"/jsonapi", "get">;
}
