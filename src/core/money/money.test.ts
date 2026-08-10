import { describe, expect, it } from "vitest";
import { addMoney, compareMoney, money, pesos, ratio, subtractMoney } from "./money";
import { formatMoney, formatSignedMoney, maskMoney, parseMoneyInput } from "./format";

/**
 * These assert the exact strings the app rendered before money became numeric.
 * The centavos migration is the only step of the restructure that rewrites
 * output rather than moving it, so byte-equality is the whole safety argument.
 */
describe("formatMoney", () => {
  it("reproduces the balances the prototype displayed", () => {
    expect(formatMoney(pesos(24680.5))).toBe("₱24,680.50");
    expect(formatMoney(pesos(8450))).toBe("₱8,450.00");
    expect(formatMoney(pesos(2340))).toBe("₱2,340.00");
    expect(formatMoney(pesos(1699))).toBe("₱1,699.00");
  });

  it("omits the fraction when asked, for whole-peso figures", () => {
    expect(formatMoney(pesos(3000), { fractionDigits: 0 })).toBe("₱3,000");
    expect(formatMoney(pesos(1240), { fractionDigits: 0 })).toBe("₱1,240");
    expect(formatMoney(pesos(1760), { fractionDigits: 0 })).toBe("₱1,760");
    expect(formatMoney(pesos(500), { fractionDigits: 0 })).toBe("₱500");
  });

  it("uses U+2212 MINUS, never an ASCII hyphen", () => {
    const negative = formatSignedMoney(pesos(-160));
    expect(negative).toBe("−₱160.00");
    expect(negative).toContain("−");
    expect(negative).not.toContain("-");
  });

  it("marks incoming money with a plus", () => {
    expect(formatSignedMoney(pesos(2000))).toBe("+₱2,000.00");
    expect(formatSignedMoney(pesos(-845.75))).toBe("−₱845.75");
  });

  it("can drop the symbol and the grouping", () => {
    expect(formatMoney(pesos(1000), { symbol: false, fractionDigits: 0 })).toBe("1,000");
    expect(formatMoney(pesos(1000), { symbol: false, grouping: false, fractionDigits: 0 })).toBe("1000");
  });

  it("never shows a sign when told not to", () => {
    expect(formatMoney(pesos(-160), { sign: "never" })).toBe("₱160.00");
  });
});

describe("maskMoney", () => {
  it("preserves the shape of the amount it hides", () => {
    expect(maskMoney(pesos(24680.5))).toBe("₱••,•••.••");
    expect(maskMoney(pesos(8450))).toBe("₱•,•••.••");
  });
});

describe("parseMoneyInput", () => {
  it("accepts what a user would plausibly type", () => {
    expect(parseMoneyInput("1,000")).toEqual(pesos(1000));
    expect(parseMoneyInput("₱1,000.50")).toEqual(pesos(1000.5));
    expect(parseMoneyInput("500.00")).toEqual(pesos(500));
    expect(parseMoneyInput("0.05")).toEqual(money(5));
  });

  it("rejects anything that is not yet a valid amount", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("abc")).toBeNull();
    expect(parseMoneyInput(".")).toBeNull();
    expect(parseMoneyInput("1.234")).toBeNull(); // more precision than centavos
    expect(parseMoneyInput("-5")).toBeNull();
  });

  it("round-trips through the formatter", () => {
    for (const value of [pesos(500), pesos(1000), pesos(2500), pesos(24680.5)]) {
      expect(parseMoneyInput(formatMoney(value, { symbol: false }))).toEqual(value);
    }
  });

  it("makes 500.00 and 500 the same amount, which string comparison did not", () => {
    expect(parseMoneyInput("500.00")).toEqual(parseMoneyInput("500"));
  });
});

describe("arithmetic", () => {
  it("adds, subtracts and compares", () => {
    expect(addMoney(pesos(10), pesos(5))).toEqual(pesos(15));
    expect(subtractMoney(pesos(10), pesos(5))).toEqual(pesos(5));
    expect(compareMoney(pesos(10), pesos(5))).toBeGreaterThan(0);
  });

  it("refuses non-integer minor units", () => {
    expect(() => money(1.5)).toThrow(TypeError);
  });

  it("computes the quest ratio", () => {
    expect(Math.round(ratio(pesos(1240), pesos(3000)) * 100)).toBe(41);
  });
});
