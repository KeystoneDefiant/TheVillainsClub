import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from "../../test/testingLibrary";
import { clubTokens } from "@/theme/clubTokens";
import { Results } from '../screen-Results';
import { Card as CardType, Hand } from '../../types';
import { getTestRewardTable } from '../../test/testHelpers';
import { calculateStreakMultiplier } from '../../utils/streakCalculator';
import { gameConfig, getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';

const mode = getCurrentGameMode();

describe('Results Component', () => {
  const createMockCard = (rank: string, suit: string, id: string): CardType => ({
    id,
    rank,
    suit: suit as 'hearts' | 'diamonds' | 'clubs' | 'spades',
    isDead: false,
    isWild: false,
  });

  const mockHand: Hand = {
    id: 'hand-1',
    cards: [
      createMockCard('A', 'hearts', 'ah'),
      createMockCard('K', 'hearts', 'kh'),
      createMockCard('Q', 'hearts', 'qh'),
      createMockCard('J', 'hearts', 'jh'),
      createMockCard('10', 'hearts', '10h'),
    ],
  };

  const mockProps = {
    playerHand: mockHand.cards,
    heldIndices: [0, 1, 2, 3, 4],
    parallelHands: [{ ...mockHand, id: 'h1' }, { ...mockHand, id: 'h2' }, { ...mockHand, id: 'h3' }],
    betAmount: 10,
    selectedHandCount: 3,
    credits: mode.startingCredits * 2,
    round: 5,
    totalEarnings: mode.startingCredits,
    rewardTable: getTestRewardTable(),
    onReturnToPreDraw: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Payout Display', () => {
    it('should display total payout correctly', () => {
      render(<Results {...mockProps} />);
      
      // 3 royal flushes * 250 * 10 = 7500 total payout (with streak)
      expect(screen.getAllByText(/7,500/).length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate profit correctly', () => {
      render(<Results {...mockProps} />);
      
      // 7500 payout - 30 bet = 7470 profit
      expect(screen.getByText(/7,470/)).toBeInTheDocument();
    });

    it('should show positive profit in gold/brass accent', () => {
      render(<Results {...mockProps} />);

      const profitElement = screen.getByText(/7,470 credits/i);
      expect(profitElement).toHaveStyle({ color: clubTokens.text.brass });
    });

    it('should show negative profit in red', () => {
      const highCardHand: Hand = {
        id: 'hc',
        cards: [
          createMockCard('2', 'hearts', '2h'),
          createMockCard('4', 'clubs', '4c'),
          createMockCard('7', 'diamonds', '7d'),
          createMockCard('9', 'spades', '9s'),
          createMockCard('K', 'hearts', 'kh'),
        ],
      };
      const lossProps = {
        ...mockProps,
        parallelHands: [highCardHand, highCardHand, highCardHand],
      };
      render(<Results {...lossProps} />);
      const profitSpan = screen.getByText(/-30 credits/i);
      expect(profitSpan).toHaveStyle({ color: clubTokens.text.accent });
    });
  });

  describe('Devil\'s Deal Cost', () => {
    it('should display Devil\'s Deal cost when deal was taken', () => {
      const props = {
        ...mockProps,
        gameState: {
          devilsDealCard: createMockCard('A', 'spades', 'as'),
          devilsDealCost: 100,
          devilsDealHeld: true,
        } as const,
      };
      
      render(<Results {...props} />);
      
      expect(screen.getByText(/Devil's Deal/i)).toBeInTheDocument();
      expect(screen.getByText(/100.*credits/i)).toBeInTheDocument();
    });

    it('should not display Devil\'s Deal line when deal not taken', () => {
      render(<Results {...mockProps} />);
      
      expect(screen.queryByText(/Devil's Deal/i)).not.toBeInTheDocument();
    });

    it('should deduct Devil\'s Deal cost from final profit', () => {
      const props = {
        ...mockProps,
        gameState: {
          devilsDealCard: createMockCard('A', 'spades', 'as'),
          devilsDealCost: 100,
          devilsDealHeld: true,
        } as const,
      };
      
      render(<Results {...props} />);
      
      // 7500 payout - 30 bet - 100 devil's deal = 7370 profit
      expect(screen.getByText(/7,370/)).toBeInTheDocument();
    });
  });

  describe('Hand Counts Summary', () => {
    it('should display hand counts', () => {
      render(<Results {...mockProps} />);
      
      expect(screen.getByText(/Royal flush.*3/i)).toBeInTheDocument();
    });

    it('should only show hands that occurred', () => {
      const onePairHand: Hand = {
        id: 'op1',
        cards: [
          createMockCard('J', 'hearts', 'jh'),
          createMockCard('J', 'clubs', 'jc'),
          createMockCard('2', 'diamonds', '2d'),
          createMockCard('5', 'spades', '5s'),
          createMockCard('9', 'hearts', '9h'),
        ],
      };
      const props = {
        ...mockProps,
        parallelHands: [mockHand, onePairHand, onePairHand],
      };
      render(<Results {...props} />);
      expect(screen.getByText(/Royal flush.*1/i)).toBeInTheDocument();
      expect(screen.getByText(/One pair.*2/i)).toBeInTheDocument();
    });

    it('should not display hands with zero count', () => {
      render(<Results {...mockProps} />);
      expect(screen.queryByText(/Straight flush/i)).not.toBeInTheDocument();
    });
  });

  describe('Held Cards Display', () => {
    it('should show all held cards', () => {
      render(<Results {...mockProps} />);
      expect(screen.getAllByText(/^A$/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/^K$/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/^Q$/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/^J$/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/^10$/).length).toBeGreaterThanOrEqual(1);
    });

    it('should not show Cards Held section when no cards held', () => {
      const props = { ...mockProps, heldIndices: [] };
      render(<Results {...props} />);
      expect(screen.queryByText(/Cards Held:/i)).not.toBeInTheDocument();
    });
  });

  describe('Round Summary', () => {
    it('should show highest combo, highest multiplier, and the combo progression graph', () => {
      const comboHands = Array.from({ length: 6 }, (_, index) => ({
        ...mockHand,
        id: `combo-${index}`,
      }));
      const props = {
        ...mockProps,
        parallelHands: comboHands,
        selectedHandCount: comboHands.length,
      };

      render(<Results {...props} />);

      const highestComboRow = screen.getByText(/Highest Combo/i).closest('div');
      expect(highestComboRow).toBeTruthy();
      expect(within(highestComboRow as HTMLElement).getByText('6')).toBeInTheDocument();
      expect(
        screen.getByText(
          `${Number(calculateStreakMultiplier(5, gameConfig.streakMultiplier).toFixed(2)).toString()}x`
        )
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Combo progression graph/i)).toBeInTheDocument();
    });
  });

  describe('Continue Button', () => {
    it('should call onReturnToPreDraw when clicked', () => {
      render(<Results {...mockProps} />);
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(continueButton);
      expect(mockProps.onReturnToPreDraw).toHaveBeenCalledTimes(1);
    });

    it('should advance when the mobile summary screen is tapped', () => {
      const { container } = render(<Results {...mockProps} />);
      fireEvent.pointerUp(container.querySelector('#results-screen')!, { pointerType: 'touch' });
      expect(mockProps.onReturnToPreDraw).toHaveBeenCalledTimes(1);
    });

    it('should ignore mouse pointer taps on the summary screen', () => {
      const { container } = render(<Results {...mockProps} />);
      fireEvent.pointerUp(container.querySelector('#results-screen')!, { pointerType: 'mouse' });
      expect(mockProps.onReturnToPreDraw).not.toHaveBeenCalled();
    });

    it('should be enabled', () => {
      render(<Results {...mockProps} />);
      const continueButton = screen.getByRole('button', { name: /Continue/i });
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers with commas', () => {
      const props = {
        ...mockProps,
        credits: 1000000,
      };
      
      render(<Results {...props} />);
      
      expect(screen.getByText(/1,000,000/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero payout', () => {
      const highCardHand: Hand = {
        id: 'hc',
        cards: [
          createMockCard('2', 'hearts', '2h'),
          createMockCard('4', 'clubs', '4c'),
          createMockCard('7', 'diamonds', '7d'),
          createMockCard('9', 'spades', '9s'),
          createMockCard('K', 'hearts', 'kh'),
        ],
      };
      const props = {
        ...mockProps,
        parallelHands: [highCardHand],
        selectedHandCount: 1,
        betAmount: 10,
      };
      render(<Results {...props} />);
      expect(document.body.textContent).toContain('0');
    });

    it('should pluralize "credit" correctly', () => {
      const onePairHand: Hand = {
        id: 'op',
        cards: [
          createMockCard('J', 'hearts', 'jh'),
          createMockCard('J', 'clubs', 'jc'),
          createMockCard('2', 'diamonds', '2d'),
          createMockCard('5', 'spades', '5s'),
          createMockCard('9', 'hearts', '9h'),
        ],
      };
      const props = {
        ...mockProps,
        parallelHands: [onePairHand],
        selectedHandCount: 1,
        betAmount: 1,
      };
      render(<Results {...props} />);
      expect(document.body.textContent).toMatch(/1 credit(?!s)/i);
    });
  });
});
