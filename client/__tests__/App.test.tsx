import React from "react";
import { render } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";
import App from "../App";

describe("<App />", () => {
  it("renders correctly", async () => {
    const { toJSON } = await render(<App />);
    expect(toJSON()).toBeDefined();
  });
});
