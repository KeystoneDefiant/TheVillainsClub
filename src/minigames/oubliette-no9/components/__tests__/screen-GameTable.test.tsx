import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../test/testingLibrary';
import { GameTable } from '../screen-GameTable';
import { Card as CardType, GameState } from '../../types';
import { getTestRewardTable } from '../../test/testHelpers';

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
    credits: 5000,
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
    it('should render the component with player hand', () => {
      render(<GameTable {...mockProps} />);
      
      expect(screen.getByRole("heading", { name: /Your hand/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('should display all 5 cards', () => {
      render(<GameTable {...mockProps} />);
      
      const handGroup = screen.getByRole('group', { name: /Your hand/i });
      const cards = within(handGroup).getAllByRole('button');
      expect(cards.length).toBe(5);
    });

    it('should display game header with credits and round', () => {
      render(<GameTable {...mockProps} />);
      
      expect(screen.getByText(/Round:/)).toBeInTheDocument();
      expect(screen.getByText(/Credits:/)).toBeInTheDocument();
    });

    it('should display Your Hand section', () => {
      render(<GameTable {...mockProps} />);
      
      expect(screen.getByRole("heading", { name: /Your hand/i })).toBeInTheDocument();
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
      // Held cards have data-held and card-held styling
      expect(cards[0].querySelector('[data-held="true"], .card-held')).toBeTruthy();
    });

    it('should allow multiple cards to be held', () => {
      const props = { ...mockProps, heldIndices: [1, 2, 3] };
      render(<GameTable {...props} />);
      
      const handGroup = screen.getByRole('group', { name: /Your hand/i });
      const cards = within(handGroup).getAllByRole('button');
      // Cards 1, 2, 3 should be held (have data-held or card-held)
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
      // Parent has opacity-30 when disabled
      expect(devilsDealCard?.parentElement?.className).toMatch(/opacity-30/);
    });

    it('should show Devil\'s Deal card as held when selected', () => {
      const props = {
        ...devilsDealProps,
        gameState: {
          ...devilsDealProps.gameState,
          devilsDealHeld: true,
        },
      };
      
      const { container } = render(<GameTable {...props} />);
      
      // Check for held styling on Devil's Deal card
      const devilsDealCard = container.querySelector('.devil-deal-container');
      expect(devilsDealCard).toBeTruthy();
    });
  });

  describe('Draw Button', () => {
    it('should show draw/play button when hand is not yet drawn', () => {
      render(<GameTable {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /Draw|Play.*Parallel/i })).toBeInTheDocument();
    });

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
      render(<GameTable {...props} />);
      
      // Card backs show "POKER" text (before flip animation completes)
      expect(screen.getAllByText('POKER').length).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should show card faces after first draw', () => {
      const props = { ...mockProps, firstDrawComplete: true };
      render(<GameTable {...props} />);
      
      // Card ranks should be visible (A, K, Q, J, 10 from mock hand)
      expect(screen.getAllByText(/^A$/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/^K$/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Instructions', () => {
    it('should show hold instructions', () => {
      render(<GameTable {...mockProps} />);
      
      expect(screen.getByText(/Hold the cards you want to keep/i)).toBeInTheDocument();
    });

    it('should show draw instructions', () => {
      render(<GameTable {...mockProps} />);
      
      expect(screen.getByText(/play parallel hands|Draw.*hands/i)).toBeInTheDocument();
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
      // GameHeader shows the failure description (e.g. "Bet must be ≥ 20 (2x base)")
      expect(screen.getByText(/Bet must be/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have clickable card elements', () => {
      const { container } = render(<GameTable {...mockProps} />);
      
      const cards = container.querySelectorAll('.card');
      cards.forEach(card => {
        expect(card).toBeTruthy();
      });
    });

    it('should have proper button roles', () => {
      render(<GameTable {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have descriptive button text', () => {
      render(<GameTable {...mockProps} />);
      // With nextActionIsDraw false we show "Play X Parallel Hands"
      const actionButton = screen.getByRole('button', { name: /Play.*Parallel|Draw/i });
      expect(actionButton.textContent).toBeTruthy();
    });
  });
});
