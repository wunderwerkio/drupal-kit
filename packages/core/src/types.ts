import { DrupalkitError } from "@drupalkit/error";
import * as DrupalkitTypes from "@drupalkit/types";
import { Fetch } from "@drupalkit/types";

import { Drupalkit } from ".";

export interface DrupalkitOptions {
  baseUrl: string;
  locale?: string;
  availableLocales?: string[];
  defaultLocale?: string;
  log?: {
    debug: (message: string) => unknown;
    info: (message: string) => unknown;
    warn: (message: string) => unknown;
    error: (message: string) => unknown;
  };
  request?: DrupalkitTypes.RequestOptions;
  fetch?: Fetch;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Constructor<T> = new (...args: any[]) => T;

export type ReturnTypeOf<T extends AnyFunction | AnyFunction[]> =
  T extends AnyFunction
  ? ReturnType<T>
  : T extends AnyFunction[]
  ? // exclude `void` from intersection
  UnionToIntersection<Exclude<ReturnType<T[number]>, void>>
  : never;

/**
 * Taken from stack overflow.
 *
 * @author https://stackoverflow.com/users/2887218/jcalz
 * @see https://stackoverflow.com/a/50375286/10325032
 */
export type UnionToIntersection<Union> = (
  Union extends any ? (argument: Union) => void : never
) extends (argument: infer Intersection) => void // tslint:disable-line: no-unused
  ? Intersection
  : never;

type AnyFunction = (...args: any) => any;

export type DrupalkitPlugin = (
  drupalkit: Drupalkit,
  options: DrupalkitOptions,
) => { [key: string]: any } | void;

export type Hooks = {
  request: {
    Options: any;
    Result: DrupalkitTypes.DrupalkitResponse<any>;
    Error: DrupalkitError;
  };
  [key: string]: {
    Options: unknown;
    Result: unknown;
    Error: unknown;
  };
};
