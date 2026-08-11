import { describe, expect, it } from "vitest";
import {
  maskMobileNumber,
  mobileNumberErrorMessage,
  normalizePhoneDigits,
  validateMobileNumber,
  type LoadOperator,
} from "./load";

const SMART: LoadOperator = {
  id: "smart",
  icon: "phone",
  name: "Smart",
  detail: "Smart, TNT & Sun numbers",
  prefixes: ["0918", "0919", "0920", "0921", "0998", "0999"],
};

const GLOBE: LoadOperator = {
  id: "globe",
  icon: "phone",
  name: "Globe",
  detail: "Globe & TM numbers",
  prefixes: ["0915", "0916", "0917", "0926", "0927", "0994"],
};

describe("normalizePhoneDigits", () => {
  it("strips the spaces and dashes a typist naturally adds", () => {
    expect(normalizePhoneDigits("0917 123-4567")).toBe("09171234567");
    expect(normalizePhoneDigits("09171234567")).toBe("09171234567");
  });
});

describe("validateMobileNumber", () => {
  it("accepts an 11-digit number on the chosen operator's prefixes", () => {
    expect(validateMobileNumber("0917 123 4567", GLOBE)).toBeNull();
    expect(validateMobileNumber("09981234567", SMART)).toBeNull();
  });

  it("rejects an empty field", () => {
    expect(validateMobileNumber("", SMART)).toBe("empty");
    expect(validateMobileNumber("   ", SMART)).toBe("empty");
  });

  it("rejects anything that is not exactly 11 digits", () => {
    expect(validateMobileNumber("0917123", SMART)).toBe("incomplete");
    expect(validateMobileNumber("091712345678", SMART)).toBe("incomplete");
    expect(validateMobileNumber("12345678901", SMART)).toBe("not-mobile");
  });

  it("rejects a number whose prefix belongs to a different operator", () => {
    // 0917 is Globe's; buying it as Smart load must be blocked.
    expect(validateMobileNumber("09171234567", SMART)).toBe("wrong-network");
    expect(validateMobileNumber("09181234567", GLOBE)).toBe("wrong-network");
  });
});

describe("maskMobileNumber", () => {
  it("masks the middle of an 11-digit number, keeping the 09 and the last three", () => {
    expect(maskMobileNumber("09174562288")).toBe("09••• •••288");
    expect(maskMobileNumber("09981234567")).toBe("09••• •••567");
  });

  it("tolerates the spaced form a user typed", () => {
    expect(maskMobileNumber("0917 456 2288")).toBe("09••• •••288");
  });
});

describe("mobileNumberErrorMessage", () => {
  it("names the operator when the network does not match", () => {
    expect(mobileNumberErrorMessage("wrong-network", SMART)).toBe("That number is not on Smart's network.");
    expect(mobileNumberErrorMessage("wrong-network", GLOBE)).toBe("That number is not on Globe's network.");
  });
});
