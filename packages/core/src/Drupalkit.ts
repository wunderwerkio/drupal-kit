import { Result } from "@wunderwerk/ts-results";
import Hook, { HookCollection } from "before-after-hook";
import qs from "qs";
import {
  DrupalkitResponse,
  Fetch,
  Log,
  RequestOptions,
  RequestRequestOptions,
  Url,
} from "@drupal-kit/types";

import { DrupalkitError } from "./DrupalkitError.js";
import fetchWrapper from "./fetch-wrapper.js";
import {
  Constructor,
  DrupalkitOptions,
  DrupalkitPlugin,
  Hooks,
  Query,
  ReturnTypeOf,
  UnionToIntersection,
} from "./types.js";
import { trimSlashesFromSegment } from "./utils.js";

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
  readonly availableLocales: string[] = [];
  readonly defaultLocale?: string;
  readonly agent = "drupalkit/0.0.0-development";
  readonly log: Log;
  readonly hook: HookCollection<Hooks>;
  private locale?: string;
  private auth?: string;

  /**
   * Attach a plugin (or many) to your Drupalkit instance.
   *
   * @param newPlugins - Array of plugins to attach.
   * @example
   * const API = Drupalkit.plugin(plugin1, plugin2, plugin3, ...)
   */
  static plugin<
    S extends Constructor<object> & { plugins: unknown[] },
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
    const hook = new Hook.Collection<Hooks>();

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

    this.applyPlugins(options);
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

    const headers = {
      ...options.headers,
      "user-agent": this.agent,
    };

    // Delete auth header if unauthenticated is true.
    if (options.unauthenticated) {
      delete headers.authorization;
    } else if (this.auth) {
      headers.authorization = this.auth;
    }

    const requestOptions = {
      ...options,
      url: this.buildUrl(url, {
        localeOverride: options.locale,
      }),
      baseUrl: this.baseUrl,
      log: this.log,
      headers,
    };

    return this.hook("request", request, requestOptions)
      .then((response) => Result.Ok(response as DrupalkitResponse<R, number>))
      .catch((error) => {
        if (error instanceof DrupalkitError) return Result.Err(error);

        return Result.Err(
          new DrupalkitError(error.message, 500, {
            request: requestOptions,
          }),
        );
      });
  }

  /**
   * Set authorization header value.
   *
   * @param auth - The authorization header value.
   */
  public setAuth(auth: string) {
    this.auth = auth;
  }

  /**
   * Checks if auth data is set.
   */
  public hasAuth() {
    return !!this.auth;
  }

  /**
   * Set the locale.
   *
   * @param locale - The locale.
   */
  public setLocale(locale: string) {
    this.locale = locale;
  }

  /**
   * Constructs a Drupal API url.
   *
   * @param url - The url for the request. Can be relative or absolute.
   * @param options - An optional object containing additional options.
   * @param options.localeOverride - An optional override for the locale.
   * @param options.customPrefix - A custom prefix to prepend to the url.
   * @param options.query - An optional object containing query parameters.
   * @returns The constructed URL as a string.
   */
  public buildUrl(
    url: Url,
    options?: {
      localeOverride?: string;
      customPrefix?: string;
      query?: Query;
    },
  ) {
    // Do nothing with absolute urls.
    if (url.startsWith("http")) {
      return url;
    }

    const locale = options?.localeOverride ?? this.locale;

    let finalUrl = this.baseUrl;

    // Prepend locale to url if the locale is not the default one.
    if (locale && locale !== this.defaultLocale) {
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

  /**
   * Applies all plugins to the drupalkit instance.
   *
   * Plugin data will be merged up to two levels.
   *
   * @param options - The drupalkit options.
   * @see https://stackoverflow.com/a/16345172
   */
  private applyPlugins(options: DrupalkitOptions) {
    const classConstructor = this.constructor as typeof Drupalkit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergedPluginData: Record<string, any> = {};

    classConstructor.plugins.forEach((plugin) => {
      const pluginData = plugin(this, options);
      if (!pluginData) {
        return;
      }

      for (const [key, value] of Object.entries(pluginData)) {
        if (!mergedPluginData[key]) {
          mergedPluginData[key] = {};
        }

        if (typeof value === "object") {
          Object.assign(mergedPluginData[key], value);
        } else {
          mergedPluginData[key] = value;
        }
      }
    });

    Object.assign(this, mergedPluginData);
  }
}
