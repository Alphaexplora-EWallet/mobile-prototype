import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import App from "../App";

/**
 * GAP-08 biller catalog: search, favorites, and the new telecom / water /
 * government categories on the Pay tab.
 */

const start = () => {
  const user = userEvent.setup();
  render(
    <BankingGatewayProvider gateway={createMockNetBankGateway()}>
      <App />
    </BankingGatewayProvider>,
  );
  return user;
};

const press = async (user: ReturnType<typeof userEvent.setup>, name: RegExp | string) =>
  user.click(screen.getByRole("button", { name }));

const openPayTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await press(user, /Start my journey/i);
  await press(user, /^Continue$/);
  await press(user, /Build my plan/i);
  const nav = screen.getByRole("navigation", { name: /primary navigation/i });
  await user.click(within(nav).getByRole("button", { name: /^Pay$/ }));
  await press(user, /Payment options/i);
  await press(user, /Pay a bill/i);
};

describe("biller catalog", () => {
  it("renders the new telecom, water, and government categories", async () => {
    const user = start();
    await openPayTab(user);

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
    await openPayTab(user);
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
    await openPayTab(user);

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
    await press(user, /Back to home/i);
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await user.click(within(nav).getByRole("button", { name: /^Home$/ }));
    await user.click(within(nav).getByRole("button", { name: /^Pay$/ }));
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
    await openPayTab(user);
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
    await press(user, /Back to home/i);
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await user.click(within(nav).getByRole("button", { name: /^Home$/ }));
    await user.click(within(nav).getByRole("button", { name: /^Pay$/ }));
    await press(user, /Payment options/i);
    await press(user, /Pay a bill/i);
    expect(screen.getByRole("searchbox", { name: /Search billers/i })).toHaveValue("mer");
    expect(screen.queryByRole("button", { name: /GlobePostpaid mobile/i })).toBeNull();
  });
});
