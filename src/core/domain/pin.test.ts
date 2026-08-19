import { describe, expect, it } from "vitest";
import { MPIN_LENGTH, confirmPinIssue, pinIssue, pinIssueMessage } from "./pin";

describe("MPIN rules", () => {
  it("accepts a six-digit PIN that is neither repeated nor sequential", () => {
    expect(pinIssue("271828")).toBeNull();
    expect(pinIssue("904517")).toBeNull();
  });

  it("rejects anything that is not six digits", () => {
    expect(pinIssue("27182")).toBe("too-short");
    expect(pinIssue("2718281")).toBe("too-short");
    expect(pinIssue("")).toBe("too-short");
    expect(pinIssue("27182a")).toBe("too-short");
  });

  it("rejects one digit repeated", () => {
    expect(pinIssue("111111")).toBe("repeated");
    expect(pinIssue("000000")).toBe("repeated");
  });

  it("rejects counting order in either direction", () => {
    expect(pinIssue("123456")).toBe("sequential");
    expect(pinIssue("987654")).toBe("sequential");
    expect(pinIssue("456789")).toBe("sequential");
  });

  it("does not mistake a near-run for a run", () => {
    expect(pinIssue("123457")).toBeNull();
    expect(pinIssue("122334")).toBeNull();
  });

  it("compares the confirmation entry only against the first", () => {
    expect(confirmPinIssue("271828", "271828")).toBeNull();
    expect(confirmPinIssue("271828", "271829")).toBe("mismatch");
    // A weak PIN is still `pinIssue`'s business, not the confirmation's.
    expect(confirmPinIssue("111111", "111111")).toBeNull();
  });

  it("has a message for every issue", () => {
    expect(pinIssueMessage("too-short")).toBe(`Your MPIN must be ${MPIN_LENGTH} digits.`);
    expect(pinIssueMessage("repeated")).toBe("Avoid an MPIN that repeats one digit.");
    expect(pinIssueMessage("sequential")).toBe("Avoid an MPIN in counting order.");
    expect(pinIssueMessage("mismatch")).toBe("Both entries must match.");
  });
});
