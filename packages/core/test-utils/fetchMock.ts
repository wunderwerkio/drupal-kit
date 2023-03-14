import type { FetchMock } from "jest-fetch-mock";

import type { Drupalkit } from "..";

export const mockResponse = (
  fm: FetchMock,
  dk: Drupalkit,
  options: {
    url: string | RegExp;
    status?: number;
    payloadFixture?: object;
    locale?: string;
    contentType?: string;
    headers?: Record<string, string>;
  },
) => {
  const url =
    typeof options.url === "string"
      ? dk.buildUrl(options.url, {
          localeOverride: options.locale,
        })
      : options.url;

  // Mock next request for url.
  fm.mockOnceIf(url, async (req) => {
    const payload = options.payloadFixture;

    return {
      body: payload ? JSON.stringify(payload) : "{}",
      headers: {
        ...options.headers,
        "content-type": options.contentType ?? "application/json",
      },
      url: req.url,
      status: options.status ?? 200,
    };
  });
};

export const mockNetworkError = (fm: FetchMock) => {
  fm.mockRejectOnce(new Error("Network Error"));
};
