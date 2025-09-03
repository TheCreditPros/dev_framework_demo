import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CreditScoreDisplay } from '../../../src/components/CreditScore/CreditScoreDisplay';

describe('CreditScoreDisplay Component', () => {
  const defaultProps = {
    score: 720,
    date: '2025-08-23',
    onScoreClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should enforce FICO score range (300-850)', () => {
    // Test minimum boundary
    const { unmount: unmount1 } = render(
      <CreditScoreDisplay {...defaultProps} score={200} />
    );
    expect(screen.getByTestId('credit-score-value')).toHaveTextContent('300');
    unmount1();

    // Test maximum boundary
    const { unmount: unmount2 } = render(
      <CreditScoreDisplay {...defaultProps} score={900} />
    );
    expect(screen.getByTestId('credit-score-value')).toHaveTextContent('850');
    unmount2();

    // Test valid score
    render(<CreditScoreDisplay {...defaultProps} score={720} />);
    expect(screen.getByTestId('credit-score-value')).toHaveTextContent('720');
  });

  it('should support keyboard navigation (WCAG 2.1 AA)', async () => {
    const user = userEvent.setup();
    render(<CreditScoreDisplay {...defaultProps} />);

    const scoreElement = screen.getByTestId('credit-score-display');
    await user.tab();
    expect(scoreElement).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(defaultProps.onScoreClick).toHaveBeenCalledWith(720);
  });

  it('should display loading state', () => {
    render(<CreditScoreDisplay {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId('credit-score-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('credit-score-value')).not.toBeInTheDocument();
  });

  it('should categorize scores correctly', () => {
    const testCases = [
      { score: 820, expectedRange: 'EXCELLENT' },
      { score: 750, expectedRange: 'VERY_GOOD' },
      { score: 680, expectedRange: 'GOOD' },
      { score: 600, expectedRange: 'FAIR' },
      { score: 500, expectedRange: 'POOR' },
    ];

    testCases.forEach(({ score, expectedRange }) => {
      const { unmount } = render(
        <CreditScoreDisplay {...defaultProps} score={score} />
      );
      expect(screen.getByTestId('credit-score-range')).toHaveTextContent(
        expectedRange
      );
      unmount();
    });
  });
});
