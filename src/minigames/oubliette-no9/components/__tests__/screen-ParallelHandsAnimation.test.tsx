import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '../../test/testingLibrary';
import { ParallelHandsAnimation } from '../screen-ParallelHandsAnimation';
import { Hand, Card } from '../../types';
import { getTestRewardTable } from '../../test/testHelpers';

vi.mock('../../hooks/useThemeAudio', () => ({
  useThemeAudio: () => ({
    playSound: vi.fn(),
  }),
}));

function createCard(rank: Card['rank'], suit: Card['suit'], id: string): Card {
  return {
    id,
    rank,
    suit,
  };
}

const winningHand: Hand = {
  id: 'winning-hand',
  cards: [
    createCard('A', 'hearts', 'ah'),
    createCard('K', 'hearts', 'kh'),
    createCard('Q', 'hearts', 'qh'),
    createCard('J', 'hearts', 'jh'),
    createCard('10', 'hearts', '10h'),
  ],
};

function renderAnimation(handCount: number) {
  const hands = Array.from({ length: handCount }, (_, index) => ({
    ...winningHand,
    id: `winning-hand-${index}`,
  }));

  return render(
    <ParallelHandsAnimation
      parallelHands={hands}
      playerHand={winningHand.cards}
      heldIndices={[0, 1]}
      rewardTable={getTestRewardTable()}
      selectedHandCount={handCount}
      betAmount={10}
      initialStreakCounter={0}
      onAnimationComplete={vi.fn()}
      audioSettings={{ musicEnabled: true, soundEffectsEnabled: true }}
      animationSpeedMode={1}
    />
  );
}

describe('ParallelHandsAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows the full hand counter immediately', () => {
    renderAnimation(2);

    expect(screen.getByText(/0 of 2 hands/i)).toBeInTheDocument();
  });

  it('renders the featured reveal stage in individual mode for small rounds', () => {
    const { container } = renderAnimation(12);

    expect(container.querySelector('[data-reveal-mode="individual"]')).toBeTruthy();
    expect(screen.getByLabelText(/abstract wave stage/i)).toBeInTheDocument();
  });

  it('switches to sampled mode for large rounds', () => {
    const { container } = renderAnimation(500);

    expect(container.querySelector('[data-reveal-mode="sampled"]')).toBeTruthy();
    expect(container.querySelector('[data-reveal-style="abstract-wave"]')).toBeTruthy();
  });

  it('does not render the previous recent-results rail', () => {
    renderAnimation(80);

    expect(screen.queryByLabelText(/recent featured results rail/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recent featured reveals/i)).not.toBeInTheDocument();
  });

  it('removes the prior filler labels from inside the animation stage', () => {
    renderAnimation(12);

    expect(screen.queryByText(/abstract wave reveal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/full reveal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cards settle before the result lands/i)).not.toBeInTheDocument();
  });

  it('lands result text after the card beat instead of showing it immediately', () => {
    const { container } = renderAnimation(1);

    expect(screen.queryByText(/royal flush/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersToNextTimer();
    });

    expect(screen.queryByText(/royal flush/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersToNextTimer();
    });

    expect(
      container.querySelector('.abstract-wave-result-layer.is-visible .abstract-wave-result-rank')
    ).toHaveTextContent(/royal flush/i);
  });

  it('syncs the left score panel with the visible reveal beat', () => {
    const { container } = renderAnimation(1);

    act(() => {
      vi.advanceTimersToNextTimer();
    });
    act(() => {
      vi.advanceTimersToNextTimer();
    });

    expect(screen.getByText(/1 of 1 hands/i)).toBeInTheDocument();
    expect(container.querySelector('.phase-b-score-row.is-focused')).toHaveTextContent(/royal flush/i);
    expect(container.querySelector('.abstract-wave-beat.is-premium-winning')).toBeTruthy();
  });

  it('counts scored hands up progressively through sampled batches', () => {
    renderAnimation(30);

    for (let step = 0; step < 8; step += 1) {
      act(() => {
        vi.advanceTimersToNextTimer();
      });
    }

    expect(screen.getByText(/2 of 30 hands/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersToNextTimer();
    });

    expect(screen.getByText(/3 of 30 hands/i)).toBeInTheDocument();
  });

  it('keeps the outgoing hand visible while the next hand begins entering', () => {
    const { container } = renderAnimation(2);

    act(() => {
      vi.advanceTimersToNextTimer();
    });
    act(() => {
      vi.advanceTimersToNextTimer();
    });
    act(() => {
      vi.advanceTimersToNextTimer();
    });
    act(() => {
      vi.advanceTimersToNextTimer();
    });

    expect(container.querySelector('.abstract-wave-stage-stack.is-overlapping')).toBeTruthy();
    expect(container.querySelector('.abstract-wave-beat.is-exiting-overlay')).toBeTruthy();
    expect(container.querySelector('.abstract-wave-beat.is-active-overlay')).toBeTruthy();
  });
});
