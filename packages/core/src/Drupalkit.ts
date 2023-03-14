import { Collection, HookCollection } from "before-after-hook";
import qs from "qs";
import { Err, Ok } from "ts-results";
import { DrupalkitError } from "@drupalkit/error";
import {
  DrupalkitResponse,
  Fetch,
  Log,
  RequestOptions,
  RequestRequestOptions,
  Url,
} from "@drupalkit/types";
import { trimSlashesFromSegment } from "@drupalkit/utils";

import fetchWrapper from "./fetch-wrapper";
import {
  Constructor,
  DrupalkitOptions,
  DrupalkitPlugin,
  Hooks,
  Query,
  ReturnTypeOf,
  UnionToIntersection,
} from "./types";

/**
 * Drupalkit base calss.
 */
export class Drupalkit {
  /**
   * Array of plugins.
   */
  static plugins: DrupalkitPlugin[] = [];

  // assigned during constructor
  readonly fetch?: Fetch;
  readonly baseUrl: string;
  readonly locale?: string;
  readonly availableLocales: string[] = [];
  readonly defaultLocale?: string;
  readonly agent = "drupalkit/0.0.0-development";
  readonly log: Log;
  readonly hook: HookCollection<Hooks>;

  /**
   * Attach a plugin (or many) to your Drupalkit instance.
   *
   * @param newPlugins - Array of plugins to attach.
   * @example
   * const API = Drupalkit.plugin(plugin1, plugin2, plugin3, ...)
   */
  static plugin<
    S extends Constructor<{ options: DrupalkitOptions }> & { plugins: unknown[] },
    T extends DrupalkitPlugin[],
  >(this: S, ...newPlugins: T) {
    const currentPlugins = this.plugins;

    /**
     * New class with attached plugins.
     */
    const NewDrupalkit = class extends this {
      static plugins = currentPlugins.concat(
        newPlugins.filter((plugin) => !currentPlugins.includes(plugin)),
      );
    };

    return NewDrupalkit as typeof this &
      Constructor<UnionToIntersection<ReturnTypeOf<T>>>;
  }

  /**
   * Construct new drupalkit instance.
   *
   * @param options - The drupakit options.
   */
  constructor(options: DrupalkitOptions) {
    const hook = new Collection<Hooks>();

    /* eslint-disable no-console */
    /* eslint-disable jsdoc/require-jsdoc */
    /* eslint-disable @typescript-eslint/no-empty-function */
    this.log = Object.assign(
      {
        debug: () => {},
        info: () => {},
        warn: console.warn.bind(console),
        error: console.error.bind(console),
      },
      options.log,
    );
    /* eslint-enable no-console */
    /* eslint-enable jsdoc/require-jsdoc */
    /* eslint-disable @typescript-eslint/no-empty-function */

    this.hook = hook;
    this.baseUrl = trimSlashesFromSegment(options.baseUrl);

    if (options.locale) {
      this.locale = options.locale;
      this.availableLocales.push(options.locale);
    }

    if (options.defaultLocale) {
      this.defaultLocale = options.defaultLocale;

      // Add default locale to available if it's not already there.
      if (!this.availableLocales.includes(options.defaultLocale)) {
        this.availableLocales.push(options.defaultLocale);
      }
    }

    if (options.availableLocales) {
      this.availableLocales = options.availableLocales;
    }

    // Set default locale to locale if set.
    if (!options.defaultLocale && options.locale) {
      this.defaultLocale = options.locale;
    } else if (!options.locale && options.defaultLocale) {
      this.locale = options.defaultLocale;
    }

    if (options.fetch) {
      this.fetch = options.fetch;
    }

    // apply plugins
    // https://stackoverflow.com/a/16345172
    const classConstructor = this.constructor as typeof Drupalkit;
    classConstructor.plugins.forEach((plugin) => {
      Object.assign(this, plugin(this, options));
    });
  }

  /**
   * Dispatch a request to the Drupal API.
   *
   * @param url - Relative or absolute url.
   * @param options - Request options.
   */
  public request<R>(url: Url, options: RequestOptions) {
    // eslint-disable-next-line jsdoc/require-jsdoc
    const request = (options: RequestRequestOptions) => {
      return fetchWrapper<R>(options);
    };

    const requestOptions = {
      ...options,
      url: this.buildUrl(url, {
        localeOverride: options.locale,
        defaultLocaleOverride: options.defaultLocale,
      }),
      baseUrl: this.baseUrl,
      log: this.log,
      headers: {
        ...options.headers,
        "user-agent": this.agent,
      },
    };

    return this.hook("request", request, requestOptions)
      .then((response) => Ok(response as DrupalkitResponse<R, number>))
      .catch((error) => {
        if (error instanceof DrupalkitError) return Err(error);

        return Err(
          new DrupalkitError(error.message, 500, {
            request: requestOptions,
          }),
        );
      });
  }

  /**
   * Constructs a Drupal API url.
   *
   * @param url - The url for the request. Can be relative or absolute.
   * @param options - An optional object containing additional options.
   * @param options.localeOverride - An optional override for the locale.
   * @param options.defaultLocaleOverride - An optional override for the default locale.
   * @param options.customPrefix - A custom prefix to prepend to the url.
   * @param options.query - An optional object containing query parameters.
   * @returns The constructed URL as a string.
   */
  public buildUrl(
    url: Url,
    options?: {
      localeOverride?: string;
      defaultLocaleOverride?: string;
      customPrefix?: string;
      query?: Query;
    },
  ) {
    // Do nothing with absolute urls.
    if (url.startsWith("http")) {
      return url;
    }

    const locale = options?.localeOverride ?? this.locale;
    const defaultLocale = options?.defaultLocaleOverride ?? this.defaultLocale;

    let finalUrl = this.baseUrl;

    // Prepend locale to url if the locale is not the default one.
    if (locale && locale !== defaultLocale) {
      finalUrl += "/" + locale;
    }

    // Add custom prefix if provided.
    if (options?.customPrefix) {
      finalUrl += "/" + trimSlashesFromSegment(options.customPrefix);
    }

    // Only append url if not empty.
    if (url) {
      finalUrl += "/" + trimSlashesFromSegment(url);
    }

    if (options?.query) {
      finalUrl += "?" + qs.stringify(options.query);
    }

    return finalUrl;
  }
}
