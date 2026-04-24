import { describe, it, expect } from "vitest";
import { screen } from "../../test/testingLibrary";
import { RewardTable } from "../RewardTable";
import { renderWithMantine } from "../../test/renderWithMantine";
import { getTestRewardTable } from "../../test/testHelpers";

describe("RewardTable", () => {
  it("renders paying ranks from the reward table in display order", () => {
    const rewardTable = getTestRewardTable();
    renderWithMantine(<RewardTable rewardTable={rewardTable} wildCardCount={1} />);

    expect(screen.getByText("Payout table")).toBeInTheDocument();
    expect(screen.getByText("Royal Flush")).toBeInTheDocument();
    expect(screen.getByText("Straight Flush")).toBeInTheDocument();
    expect(screen.getByText("Five Of A Kind")).toBeInTheDocument();
    expect(screen.queryByText("High Card")).not.toBeInTheDocument();
  });

  it("hides zero-payout ranks", () => {
    const rewardTable = { ...getTestRewardTable(), "high-card": 0 };
    expect(rewardTable["high-card"]).toBe(0);
    renderWithMantine(<RewardTable rewardTable={rewardTable} wildCardCount={0} />);

    expect(screen.queryByText("High Card")).not.toBeInTheDocument();
  });

  it("shows wild-card requirement note for five of a kind when wildCardCount is 0", () => {
    const rewardTable = getTestRewardTable();
    renderWithMantine(<RewardTable rewardTable={rewardTable} wildCardCount={0} />);

    expect(screen.getByText("Five Of A Kind")).toBeInTheDocument();
    expect(screen.getByText(/Requires at least one wild card in the deck/i)).toBeInTheDocument();
  });

  it("does not show wild-card note when wildCardCount is above zero", () => {
    const rewardTable = getTestRewardTable();
    renderWithMantine(<RewardTable rewardTable={rewardTable} wildCardCount={1} />);

    expect(screen.getByText("Five Of A Kind")).toBeInTheDocument();
    expect(screen.queryByText(/Requires at least one wild card/i)).not.toBeInTheDocument();
  });

  it("applies payout-highlight when highlightRank matches", () => {
    const rewardTable = getTestRewardTable();
    const { container } = renderWithMantine(
      <RewardTable rewardTable={rewardTable} wildCardCount={0} highlightRank="flush" />,
    );

    const highlighted = container.querySelector(".payout-highlight");
    expect(highlighted).toBeTruthy();
  });
});
