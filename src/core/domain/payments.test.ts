import { describe, expect, it } from "vitest";
import { searchBillers, type Biller } from "./payments";

const billers: readonly Biller[] = [
  { id: "power", icon: "bolt", name: "Meralco", detail: "Electricity", due: "Due Aug 18", category: "electric" },
  { id: "internet", icon: "globe", name: "Converge", detail: "Home internet", due: "Due Aug 22", category: "telecom" },
  { id: "maynilad", icon: "droplet", name: "Maynilad", detail: "Water utility", due: "Due Aug 21", category: "water" },
  {
    id: "manila-water",
    icon: "droplet",
    name: "Manila Water",
    detail: "Water utility",
    due: "Due Aug 24",
    category: "water",
  },
];

describe("searchBillers", () => {
  it("returns every biller for an empty or whitespace-only query", () => {
    expect(searchBillers(billers, "")).toEqual(billers);
    expect(searchBillers(billers, "   ")).toEqual(billers);
  });

  it("matches a prefix of the biller name", () => {
    expect(searchBillers(billers, "mer").map((biller) => biller.id)).toEqual(["power"]);
  });

  it("matches a substring anywhere in the name", () => {
    expect(searchBillers(billers, "lad").map((biller) => biller.id)).toEqual(["maynilad"]);
    expect(searchBillers(billers, "water").map((biller) => biller.id)).toEqual(["manila-water"]);
  });

  it("is case-insensitive and trims surrounding whitespace", () => {
    expect(searchBillers(billers, "  MANILA ").map((biller) => biller.id)).toEqual(["manila-water"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(searchBillers(billers, "electricity")).toEqual([]);
  });
});
