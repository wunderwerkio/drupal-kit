import { isJsonApiRequest } from "../src/utils";

describe("utils", () => {
  it("should check if jsonapi request", () => {
    expect(
      isJsonApiRequest({
        method: "GET",
        headers: {
          "Content-type": "application/json",
        },
      }),
    ).toBeFalsy();

    expect(
      isJsonApiRequest({
        method: "GET",
        headers: {
          "Content-type": "application/vnd.api+json",
        },
      }),
    ).toBeTruthy();
  });
});
