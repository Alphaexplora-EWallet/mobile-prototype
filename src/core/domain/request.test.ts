import { describe, expect, it } from "vitest";
import { pesos } from "../money/money";
import { requestAmountErrorMessage, requestStatusLabel, validateRequestAmount } from "./request";

describe("validateRequestAmount", () => {
  it("accepts any amount greater than zero", () => {
    expect(validateRequestAmount(pesos(500))).toBeNull();
    expect(validateRequestAmount(pesos(0.5))).toBeNull();
  });

  it("rejects a null amount (unparsable input)", () => {
    expect(validateRequestAmount(null)).toBe("empty");
  });

  it("rejects zero and negative amounts", () => {
    expect(validateRequestAmount(pesos(0))).toBe("empty");
    expect(validateRequestAmount(pesos(-250))).toBe("empty");
  });
});

describe("requestStatusLabel", () => {
  it("names each lifecycle state", () => {
    expect(requestStatusLabel("pending")).toBe("Pending");
    expect(requestStatusLabel("accepted")).toBe("Accepted");
    expect(requestStatusLabel("rejected")).toBe("Rejected");
  });
});

describe("requestAmountErrorMessage", () => {
  it("explains the empty amount", () => {
    expect(requestAmountErrorMessage("empty")).toBe("Enter the amount you want to request.");
  });
});
