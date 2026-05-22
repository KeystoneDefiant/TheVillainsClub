import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '../../test/testingLibrary';
import { GameOver } from '../screen-GameOver';
import { createTestGameState } from '../../test/testHelpers';

describe('GameOver Component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats average per round with commas and one decimal place', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(
      <GameOver
        round={4}
        totalEarnings={12345}
        credits={500}
        gameOverReason="insufficient-credits"
        gameState={createTestGameState({
          handCount: 42,
          runHighestCombo: 17,
          runHighestMultiplier: 3.5,
        })}
        onReturnToMenu={vi.fn()}
      />
    );

    const avgCard = screen.getAllByText('Avg per Round')[0]?.closest('div');
    expect(avgCard).toBeTruthy();
    expect(within(avgCard as HTMLElement).getByText('3,086.3')).toBeInTheDocument();
  });

  it('shows final parallel hands and best run streak stats', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(
      <GameOver
        round={9}
        totalEarnings={50000}
        credits={2500}
        gameOverReason="minimum-win-percent"
        gameState={createTestGameState({
          handCount: 88,
          runHighestCombo: 19,
          runHighestMultiplier: 4.25,
        })}
        onReturnToMenu={vi.fn()}
      />
    );

    const marquee = screen.getByLabelText(/Run statistics marquee/i);
    expect(within(marquee).getAllByText("88").length).toBeGreaterThan(0);
    expect(within(marquee).getAllByText("19").length).toBeGreaterThan(0);
    expect(within(marquee).getAllByText("4.25x").length).toBeGreaterThan(0);
  });

});
