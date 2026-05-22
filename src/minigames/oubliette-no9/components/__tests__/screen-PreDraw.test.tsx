import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from '../../test/testingLibrary';
import { PreDraw } from '../screen-PreDraw';
import { Settings } from '../Settings';
import { FailureStateType, GameState } from '../../types';
import { getTestRewardTable } from '../../test/testHelpers';
import { gameConfig, getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

const mode = getCurrentGameMode();
const generousCredits = mode.startingCredits * 2;

describe('PreDraw Component', () => {
  const mockProps = {
    credits: generousCredits,
    handCount: 50,
    selectedHandCount: mode.startingHandCount,
    betAmount: 5,
    minimumBet: mode.startingBet,
    rewardTable: getTestRewardTable(),
    gameOver: false,
    round: 1,
    totalEarnings: 0,
    onSetBetAmount: vi.fn(),
    onSetSelectedHandCount: vi.fn(),
    onDealHand: vi.fn(),
    onEndRun: vi.fn(),
    onCheatAddCredits: vi.fn(),
    onCheatAddHands: vi.fn(),
    onCheatSetDevilsDeal: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display Values', () => {
    it('should display current credits correctly', () => {
      render(<PreDraw {...mockProps} />);
      expect(screen.getByText(new RegExp(generousCredits.toLocaleString()))).toBeInTheDocument();
    });

    it('should show total cost to play', () => {
      render(<PreDraw {...mockProps} />);
      const totalBetCost = mockProps.minimumBet * mockProps.handCount;
      expect(screen.getByText(new RegExp(`^${totalBetCost}$`))).toBeInTheDocument();
    });
  });

  describe('Run Round Button', () => {
    it('should be enabled when player can afford bet', () => {
      render(<PreDraw {...mockProps} />);
      const dealButton = screen.getByRole('button', { name: /Run Round/i });

      expect(dealButton).not.toBeDisabled();
    });

    it('should be disabled when player cannot afford bet', () => {
      const props = { ...mockProps, credits: 10 };
      render(<PreDraw {...props} />);
      const dealButton = screen.getByRole('button', { name: /Run Round/i });

      expect(dealButton).toBeDisabled();
    });

    it('should call onDealHand when clicked', () => {
      render(<PreDraw {...mockProps} />);
      const dealButton = screen.getByRole('button', { name: /Run Round/i });

      fireEvent.click(dealButton);
      expect(mockProps.onDealHand).toHaveBeenCalledTimes(1);
    });

    it('should be disabled in game over state', () => {
      const props = { ...mockProps, gameOver: true };
      render(<PreDraw {...props} />);
      const dealButton = screen.getByRole('button', { name: /Cannot Play - Game Over/i });

      expect(dealButton).toBeDisabled();
    });
  });

  describe("Cash Out Confirmation", () => {
    function clickCashOut() {
      const btn = screen.getByText("Cash Out").closest("button");
      expect(btn).toBeTruthy();
      fireEvent.click(btn as HTMLButtonElement);
    }

    it("should show confirmation dialog when Cash Out clicked at round 31", async () => {
      render(<PreDraw {...mockProps} round={31} />);
      clickCashOut();
      expect(await screen.findByText(/Are you sure/i)).toBeInTheDocument();
    });

    it("should call onEndRun when confirmed", async () => {
      render(<PreDraw {...mockProps} round={31} />);
      clickCashOut();
      const confirmButton = await screen.findByRole("button", { name: /Confirm Cash Out/i });
      fireEvent.click(confirmButton);
      expect(mockProps.onEndRun).toHaveBeenCalledTimes(1);
    });

    it("should not call onEndRun when cancelled", async () => {
      render(<PreDraw {...mockProps} round={31} />);
      clickCashOut();
      const dialog = (await screen.findByText(/Are you sure you want to cash out this run/i)).closest(
        '[role="dialog"]',
      );
      expect(dialog).toBeTruthy();
      const cancelButton = within(dialog as HTMLElement).getByRole("button", { name: /^Cancel$/i });
      fireEvent.click(cancelButton);
      expect(mockProps.onEndRun).not.toHaveBeenCalled();
    });

    it("should hide voluntary cash-out before round 31", () => {
      render(<PreDraw {...mockProps} round={30} />);

      expect(screen.queryByRole("button", { name: /cash out and return to the club/i })).not.toBeInTheDocument();
    });
  });

  describe('Failure State Display', () => {
    it('should show failure condition in main panel when in failure state', () => {
      const failureState: FailureStateType = 'minimum-bet-multiplier';
      const gameState = {
        baseMinimumBet: 10,
        round: 31,
        totalEarnings: 100,
        winningHandsLastRound: 5,
      } as GameState;

      const props = { ...mockProps, failureState, gameState };
      render(<PreDraw {...props} />);

      expect(screen.getByText(/Bet must be/)).toBeInTheDocument();
    });

    it('should not show failure condition in normal state', () => {
      render(<PreDraw {...mockProps} />);

      expect(screen.queryByText(/Failure Condition/i)).not.toBeInTheDocument();
    });
  });

  describe('End Game Conditions Display', () => {
    it('should show end game conditions when endless mode is active', () => {
      const gameState = {
        isEndlessMode: true,
        baseMinimumBet: 2,
        round: 31,
      } as GameState;

      const props = { ...mockProps, gameState };
      render(<PreDraw {...props} />);

      expect(screen.getByText(/End Game Active/i)).toBeInTheDocument();
    });

    it('should not show end game conditions when endless mode is not active', () => {
      const gameState = { isEndlessMode: false } as GameState;
      const props = { ...mockProps, gameState };
      render(<PreDraw {...props} />);

      expect(screen.queryByText(/End Game Active/i)).not.toBeInTheDocument();
    });

    it('should not show end game conditions when game over', () => {
      const gameState = {
        isEndlessMode: true,
        baseMinimumBet: 2,
        round: 31,
      } as GameState;

      const props = { ...mockProps, gameState, gameOver: true };
      render(<PreDraw {...props} />);

      expect(screen.queryByText(/End Game Active/i)).not.toBeInTheDocument();
    });
  });

  describe('Cheats (via Settings)', () => {
    it('should show cheats in Settings when opened with cheat callbacks', () => {
      const onClose = vi.fn();
      render(
        <Settings
          onClose={onClose}
          onCheatAddCredits={mockProps.onCheatAddCredits}
          onCheatAddHands={mockProps.onCheatAddHands}
          onCheatSetDevilsDeal={mockProps.onCheatSetDevilsDeal}
        />
      );
      const cheatsAccordion = screen.getByRole('button', { name: /Cheats/i });
      fireEvent.click(cheatsAccordion);
      expect(
        screen.getByText(
          new RegExp(`Add\\s*${gameConfig.cheatsModal.creditTopUps[0].toLocaleString()}\\s*Credits`, "i"),
        ),
      ).toBeInTheDocument();
    });
  });
});
