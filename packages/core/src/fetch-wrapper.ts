import { isPlainObject } from "is-plain-object";
import nodeFetch, { HeadersInit, Response } from "node-fetch";
import { Fetch, RequestRequestOptions } from "@drupal-kit/types";

import { DrupalkitError } from "./DrupalkitError";
import getBuffer from "./get-buffer-response";

/**
 * Function that wraps the fetch call.
 *
 * Sets up the request and handles errors and responses.
 *
 * @param requestOptions - Options for the request.
 */
export default function fetchWrapper<R>(
  requestOptions: RequestRequestOptions & {
    redirect?: "error" | "follow" | "manual";
    fetch?: Fetch;
  },
) {
  //const log = requestOptions.log ? requestOptions.log : console;

  if (
    isPlainObject(requestOptions.body) ||
    Array.isArray(requestOptions.body)
  ) {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }

  const headers: { [header: string]: string } = {};
  let status: number;
  let url: string;

  const fetch: typeof nodeFetch =
    requestOptions.fetch ||
    globalThis.fetch ||
    /* istanbul ignore next */ nodeFetch;

  return fetch(
    requestOptions.url,
    Object.assign(
      {
        method: requestOptions.method,
        body: requestOptions.body,
        headers: requestOptions.headers as HeadersInit,
        redirect: requestOptions.redirect,
      },
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      requestOptions as any,
    ),
  )
    .then(async (response) => {
      url = response.url;
      status = response.status;

      for (const [key, value] of response.headers) {
        headers[key] = value;
      }

      if (status === 204 || status === 205) {
        return;
      }

      if (status >= 400) {
        const data = await getResponseData(response);

        const error = new DrupalkitError(toErrorMessage(data), status, {
          response: {
            url,
            status,
            headers,
            data,
          },
          request: requestOptions,
        });

        throw error;
      }

      return getResponseData(response);
    })
    .then((data) => {
      return {
        status,
        url,
        headers,
        data: data as R,
      };
    })
    .catch((error) => {
      if (error instanceof DrupalkitError) throw error;
      // @todo Uncomment if AbortSignal is implemented.
      //else if (error.name === "AbortError") throw error;

      throw new DrupalkitError(error.message, 500, {
        request: requestOptions,
      });
    });
}

/**
 * Extract data from response depending on the content type.
 *
 * @param response - Response object.
 */
async function getResponseData(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType && /application\/(vnd\.api\+json|json)/.test(contentType)) {
    return response.json();
  }

  if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
    return response.text();
  }

  return getBuffer(response);
}

/**
 * Convert the error message to a human readable string.
 *
 * @param data - Error data.
 */
function toErrorMessage(data: unknown): string {
  if (typeof data === "string") return data;

  // istanbul ignore else - just in case
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data = data as any;

  if (data && typeof data === "object") {
    if ("message" in data) {
      if ("errors" in data && Array.isArray(data.errors)) {
        return `${data.message}: ${data.errors
          .map((err) => JSON.stringify(err))
          .join(", ")}`;
      }

      return String(data.message);
    }
  }

  // istanbul ignore next - just in case
  return `Unknown error: ${JSON.stringify(data)}`;
}
