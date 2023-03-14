import Hook, { HookCollection } from "before-after-hook";
import { Err, Ok } from "ts-results";
import { DrupalkitError } from "@drupalkit/error";
import {
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
  //request: typeof request;
  log: Log;

  hook: HookCollection<Hooks>;

  fetch?: Fetch;

  baseUrl: string;
  locale?: string;
  availableLocales: string[] = [];
  defaultLocale?: string;

  agent = "drupalkit/0.0.0-development";

  /**
   * Attach a plugin (or many) to your Drupalkit instance.
   *
   * @example
   * const API = Drupalkit.plugin(plugin1, plugin2, plugin3, ...)
   */
  static plugin<
    S extends Constructor<any> & { plugins: any[] },
    T extends DrupalkitPlugin[],
  >(this: S, ...newPlugins: T) {
    const currentPlugins = this.plugins;
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

    this.log = Object.assign(
      {
        debug: () => { },
        info: () => { },
        warn: console.warn.bind(console),
        error: console.error.bind(console),
      },
      options.log,
    );

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
  public request(url: Url, options: RequestOptions) {
    const request = (options: RequestRequestOptions) => {
      return fetchWrapper(options);
    };

    const requestOptions = {
      ...options,
      url: this.buildUrl(url, options.locale, options.defaultLocale),
      baseUrl: this.baseUrl,
      log: this.log,
      headers: {
        ...options.headers,
        "user-agent": this.agent,
      },
    };

    return this.hook("request", request, requestOptions)
      .then((response) => Ok(response))
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
   * Build proper request url.
   *
   * Prepends the baseUrl for relative urls.
   * Adds necessary locale prefixes.
   */
  private buildUrl(
    url: Url,
    localeOverride?: string,
    defaultLocaleOverride?: string,
  ) {
    const locale = localeOverride ?? this.locale;
    const defaultLocale = defaultLocaleOverride ?? this.defaultLocale;

    // Do nothing with absolute urls.
    if (!url.startsWith("/")) {
      return url;
    }

    let finalUrl = this.baseUrl;

    // Prepend locale to url if the locale is not the default one.
    if (locale && locale !== defaultLocale) {
      finalUrl += "/" + locale;
    }

    return finalUrl + "/" + trimSlashesFromSegment(url);
  }
}
