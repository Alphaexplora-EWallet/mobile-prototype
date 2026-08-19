import { describe, expect, it } from "vitest";
import {
  isValidMobileNumber,
  maskMobileNumber,
  mobileNumberFormatMessage,
  normalizeMobileNumber,
  toNationalMobile,
} from "./mobile";

describe("mobile number rules", () => {
  it("accepts an 11-digit number starting with 09", () => {
    expect(isValidMobileNumber("09174562288")).toBe(true);
    expect(isValidMobileNumber("09986541140")).toBe(true);
  });

  it("rejects wrong prefixes, lengths and stray characters", () => {
    expect(isValidMobileNumber("19174562288")).toBe(false); // not 09
    expect(isValidMobileNumber("0917456228")).toBe(false); // 10 digits
    expect(isValidMobileNumber("091745622880")).toBe(false); // 12 digits
    expect(isValidMobileNumber("0917 456 2288")).toBe(true); // spaced digits are fine
    expect(isValidMobileNumber("0917-456-2288")).toBe(true); // dashed digits are fine
    expect(isValidMobileNumber("0917ABC2288")).toBe(false); // letters
    expect(isValidMobileNumber("")).toBe(false);
  });

  it("normalises input to digits only", () => {
    expect(normalizeMobileNumber("0917 456-2288")).toBe("09174562288");
    expect(normalizeMobileNumber("+63 917 456 2288")).toBe("639174562288");
  });

  it("masks to the first four and last four digits", () => {
    expect(maskMobileNumber("09174562288")).toBe("0917 ••• 2288");
    expect(maskMobileNumber("0917 456 2288")).toBe("0917 ••• 2288");
  });

  it("folds every written form of one number to the national form", () => {
    expect(toNationalMobile("+63 917 555 2288")).toBe("09175552288");
    expect(toNationalMobile("639175552288")).toBe("09175552288");
    expect(toNationalMobile("9175552288")).toBe("09175552288");
    expect(toNationalMobile("0917 555 2288")).toBe("09175552288");
    // Every folded form is then something isValidMobileNumber accepts.
    expect(isValidMobileNumber(toNationalMobile("+63 917 555 2288"))).toBe(true);
  });

  it("leaves a number it cannot recognise alone rather than mangling it", () => {
    expect(toNationalMobile("12345")).toBe("12345");
    expect(toNationalMobile("")).toBe("");
  });

  it("offers a single, human message for the invalid case", () => {
    expect(mobileNumberFormatMessage()).toBe("Enter an 11-digit Philippine mobile number starting with 09.");
  });
});
