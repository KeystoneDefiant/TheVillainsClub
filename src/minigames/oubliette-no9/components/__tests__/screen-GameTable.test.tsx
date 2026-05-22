import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../test/testingLibrary';
import { getCurrentGameMode } from '@/config/minigames/oublietteNo9GameRules';
import { GameTable } from '../screen-GameTable';
import { Card as CardType, GameState } from '../../types';
import { getTestRewardTable } from '../../test/testHelpers';

const mode = getCurrentGameMode();

describe('GameTable Component', () => {
  const createMockCard = (rank: string, suit: string, id: string): CardType => ({
    id,
    rank,
    suit: suit as 'hearts' | 'diamonds' | 'clubs' | 'spades',
    isDead: false,
    isWild: false,
  });

  const mockPlayerHand: CardType[] = [
    createMockCard('A', 'hearts', 'ah'),
    createMockCard('K', 'hearts', 'kh'),
    createMockCard('Q', 'hearts', 'qh'),
    createMockCard('J', 'hearts', 'jh'),
    createMockCard('10', 'hearts', '10h'),
  ];

  const mockProps = {
    playerHand: mockPlayerHand,
    heldIndices: [],
    parallelHands: [],
    rewardTable: getTestRewardTable(),
    credits: mode.startingCredits,
    selectedHandCount: 10,
    round: 1,
    totalEarnings: 500,
    firstDrawComplete: true,
    nextActionIsDraw: false,
    onToggleHold: vi.fn(),
    onToggleDevilsDealHold: vi.fn(),
    onDraw: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should display all 5 cards', () => {
      render(<GameTable {...mockProps} />);
      
      const handGroup = screen.getByRole('group', { name: /Your hand/i });
      const cards = within(handGroup).getAllByRole('button');
      expect(cards.length).toBe(5);
    });
  });

  describe('Card Selection', () => {
    it('should allow clicking cards to hold them', () => {
      render(<GameTable {...mockProps} />);
      const handGroup = screen.getByRole('group', { name: /Your hand/i });
      const cards = within(handGroup).getAllByRole('button');
      
      fireEvent.click(cards[0]);
      expect(mockProps.onToggleHold).toHaveBeenCalledWith(0);
    });

    it('should call onToggleHold for each card click', () => {
      render(<GameTable {...mockProps} />);
      const handGroup = screen.getByRole('group', { name: /Your hand/i });
      const cards = within(handGroup).getAllByRole('button');
      
      fireEvent.click(cards[2]);
      expect(mockProps.onToggleHold).toHaveBeenCalledWith(2);
    });

    it('should visually indicate held cards', () => {
      const props = { ...mockProps, heldIndices: [0, 2, 4] };
      render(<GameTable {...props} />);
      
      const handGroup = screen.getByRole('group', { name: /Your hand/i });
      const cards = within(handGroup).getAllByRole('button');
      expect(cards[0].querySelector('[data-held="true"], .card-held')).toBeTruthy();
    });

    it('should allow multiple cards to be held', () => {
      const props = { ...mockProps, heldIndices: [1, 2, 3] };
      render(<GameTable {...props} />);
      
      const handGroup = screen.getByRole('group', { name: /Your hand/i });
      const cards = within(handGroup).getAllByRole('button');
      const heldCards = cards.filter(c => c.querySelector('[data-held="true"], .card-held'));
      expect(heldCards.length).toBe(3);
    });
  });

  describe('Devil\'s Deal Card', () => {
    const devilsDealProps = {
      ...mockProps,
      gameState: {
        devilsDealCard: createMockCard('A', 'spades', 'as'),
        devilsDealCost: 100,
        devilsDealHeld: false,
      },
    };

    it('should render Devil\'s Deal card when offered', () => {
      render(<GameTable {...devilsDealProps} />);
      
      expect(screen.getByText(/Cost:.*100.*credits/i)).toBeInTheDocument();
    });

    it('should call onToggleDevilsDealHold when Devil\'s Deal card clicked', () => {
      render(<GameTable {...devilsDealProps} />);
      
      const devilsDealContainer = screen.getByText(/Cost:.*100.*credits/i).closest('.devil-deal-container');
      expect(devilsDealContainer).toBeTruthy();
      fireEvent.click(devilsDealContainer!);
      expect(mockProps.onToggleDevilsDealHold).toHaveBeenCalled();
    });

    it('should disable Devil\'s Deal card when 5 regular cards are held', () => {
      const props = {
        ...devilsDealProps,
        heldIndices: [0, 1, 2, 3, 4],
      };
      
      const { container } = render(<GameTable {...props} />);
      const devilsDealCard = container.querySelector('.devil-deal-container');
      expect(devilsDealCard?.parentElement?.className).toMatch(/opacity-30/);
    });
  });

  describe('Draw Button', () => {
    it('should be enabled when cards can be drawn', () => {
      render(<GameTable {...mockProps} />);
      const actionButton = screen.getByRole('button', { name: /Draw|Play.*Parallel/i });
      
      expect(actionButton).not.toBeDisabled();
    });

    it('should be disabled when parallel hands already exist', () => {
      const props = {
        ...mockProps,
        parallelHands: [{ cards: mockPlayerHand, id: 'ph1' }],
      };
      
      render(<GameTable {...props} />);
      const actionButton = screen.getByRole('button', { name: /Draw|Play.*Parallel/i });
      
      expect(actionButton).toBeDisabled();
    });

    it('should call onDraw when clicked', () => {
      render(<GameTable {...mockProps} />);
      const actionButton = screen.getByRole('button', { name: /Draw|Play.*Parallel/i });
      
      fireEvent.click(actionButton);
      expect(mockProps.onDraw).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card Back Display', () => {
    it('should show card backs before first draw', () => {
      vi.useFakeTimers();
      const props = { ...mockProps, firstDrawComplete: false };
      const { container } = render(<GameTable {...props} />);
      
      expect(container.querySelectorAll('.card-back').length).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should show card faces after first draw', () => {
      const props = { ...mockProps, firstDrawComplete: true };
      render(<GameTable {...props} />);
      
      expect(screen.getAllByText(/^A$/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/^K$/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Failure State Display', () => {
    it('should display failure warnings when in failure state', () => {
      const props = {
        ...mockProps,
        failureState: 'minimum-bet-multiplier' as const,
        gameState: { baseMinimumBet: 10, betAmount: 15 } as Partial<GameState>,
      };
      
      render(<GameTable {...props} />);
      expect(screen.getByText(/Bet must be/i)).toBeInTheDocument();
    });
  });
});
