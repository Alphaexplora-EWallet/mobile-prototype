import { describe, expect, it } from "vitest";
import { press, renderApp as start, type TestUser } from "@/test/helpers/renderApp";
import { screen } from "@testing-library/react";

/**
 * GAP-08 biller catalog: search, favorites, and the new telecom / water /
 * government categories on the bill-entry screen.
 */

const openBillers = async (user: TestUser) => {
  // Scan is a Home quick action now; the Pay tab it replaced offered the same
  // four actions Home already had, and Activity has the tab slot.
  await press(user, /^Scan$/);
  await press(user, /Payment options/i);
  await press(user, /Pay a bill/i);
};

describe("biller catalog", () => {
  it("renders the new telecom, water, and government categories", async () => {
    const user = start();
    await openBillers(user);

    expect(screen.getByRole("button", { name: /GlobePostpaid mobile/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /SmartMobile & broadband/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /MayniladWater utility/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Manila WaterWater utility/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /SSSSocial security/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Pag-IBIGHousing fund/i })).toBeTruthy();

    // The category headings are part of the catalog presentation.
    expect(screen.getByText("Telecom")).toBeTruthy();
    expect(screen.getByText("Water")).toBeTruthy();
    expect(screen.getByText("Government")).toBeTruthy();
  });

  it("filters billers by substring and prefix on name", async () => {
    const user = start();
    await openBillers(user);
    const search = screen.getByRole("searchbox", { name: /Search billers/i });

    // Substring: only Manila Water contains "water" in its name.
    await user.type(search, "water");
    expect(screen.getByRole("button", { name: /Manila WaterWater utility/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /MayniladWater utility/i })).toBeNull();

    // Prefix: "mer" is the start of Meralco and nothing else.
    await user.clear(search);
    await user.type(search, "mer");
    expect(screen.getByRole("button", { name: /MeralcoElectricity/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /GlobePostpaid mobile/i })).toBeNull();

    // A query that matches nothing shows the empty state.
    await user.clear(search);
    await user.type(search, "zzz");
    expect(screen.getByText("No billers match that search.")).toBeTruthy();

    // Clearing the search restores the full catalog.
    await user.clear(search);
    expect(screen.getByRole("button", { name: /GlobePostpaid mobile/i })).toBeTruthy();
  });

  it("toggles favorites and keeps them across navigation within the session", async () => {
    const user = start();
    await openBillers(user);

    // No favorites section until something is starred.
    expect(screen.queryByText("Favorites")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Add Meralco to favorites" }));

    // A pinned Favorites section appears above the grouped catalog, so the
    // favorited biller now renders twice (section + its category group).
    expect(screen.getByText("Favorites")).toBeTruthy();
    const stars = screen.getAllByRole("button", { name: "Remove Meralco from favorites" });
    expect(stars.length).toBe(2);
    expect(stars[0]).toHaveAttribute("aria-pressed", "true");

    // Leave the tab and come back: the favorite persists within the session.
    // Out and back in the way the screens stack now: bill entry backs onto
    // Scan, Scan backs onto Home. Scan is no longer a tab to switch away from.
    await press(user, /Back to home/i);
    await press(user, /Back to home/i);
    await press(user, /^Scan$/);
    await press(user, /Payment options/i);
    await press(user, /Pay a bill/i);
    expect(screen.getByText("Favorites")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Remove Meralco from favorites" }).length).toBe(2);

    // Unfavoriting removes the pinned section; the row keeps its outline star.
    await user.click(screen.getAllByRole("button", { name: "Remove Meralco from favorites" })[0]);
    expect(screen.queryByText("Favorites")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Add Meralco to favorites" }).length).toBe(1);
  });

  it("hides the favorites section while searching and keeps the query in-session", async () => {
    const user = start();
    await openBillers(user);
    await user.click(screen.getByRole("button", { name: "Add Meralco to favorites" }));

    const search = screen.getByRole("searchbox", { name: /Search billers/i });
    await user.type(search, "mer");

    // A non-empty query hides the pinned section; the matched favorite still
    // renders once, with its filled star, inside the Electricity group.
    expect(screen.queryByText("Favorites")).toBeNull();
    const stars = screen.getAllByRole("button", { name: "Remove Meralco from favorites" });
    expect(stars.length).toBe(1);
    expect(stars[0]).toHaveAttribute("aria-pressed", "true");

    // Like favorites, the query is session state: it survives a tab switch.
    // Out and back in the way the screens stack now: bill entry backs onto
    // Scan, Scan backs onto Home. Scan is no longer a tab to switch away from.
    await press(user, /Back to home/i);
    await press(user, /Back to home/i);
    await press(user, /^Scan$/);
    await press(user, /Payment options/i);
    await press(user, /Pay a bill/i);
    expect(screen.getByRole("searchbox", { name: /Search billers/i })).toHaveValue("mer");
    expect(screen.queryByRole("button", { name: /GlobePostpaid mobile/i })).toBeNull();
  });
});
