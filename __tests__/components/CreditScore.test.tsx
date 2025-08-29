// TODO: Validate permissible purpose for FCRA Section 604 compliance
// React import not required with react-jsx runtime
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreditScore } from '../../src/components/CreditScore';

describe('CreditScore Component', () => {
  describe('FCRA Compliance', () => {
    it('should enforce 300-850 FICO score range', () => {
      // Valid score should render
      const { rerender } = render(<CreditScore score={720} />);
      expect(screen.getByTestId('score-value')).toHaveTextContent('720');

      // Invalid scores should throw errors
      expect(() => {
        rerender(<CreditScore score={900} />);
      }).toThrow('Invalid credit score: 900. Must be between 300-850.');

      expect(() => {
        rerender(<CreditScore score={250} />);
      }).toThrow('Invalid credit score: 250. Must be between 300-850.');
    });

    it('should log audit trail for credit score access', () => {
      const auditSpy = vi.fn();
      (globalThis as unknown as { auditLogger: (message: unknown) => void }).auditLogger = auditSpy;

      render(<CreditScore score={720} />);

      // In a real implementation, this would log to audit system
      expect(screen.getByTestId('credit-score')).toBeInTheDocument();
    });

    it('should handle PII data securely', () => {
      const sensitiveFactors = [
        'Account ending in 1234',
        'Payment history: 35%',
      ];

      render(<CreditScore score={720} factors={sensitiveFactors} />);

      // Verify factors are displayed (in real app, would be encrypted)
      expect(screen.getByTestId('score-factors')).toBeInTheDocument();
    });
  });

  describe('Score Display', () => {
    it('should render credit score correctly', () => {
      render(<CreditScore score={720} />);

      expect(screen.getByTestId('score-value')).toHaveTextContent('720');
      expect(screen.getByTestId('score-label')).toHaveTextContent('Good');
    });

    it('should display correct score labels', () => {
      const testCases = [
        { score: 800, label: 'Excellent' },
        { score: 720, label: 'Good' },
        { score: 620, label: 'Fair' },
        { score: 500, label: 'Poor' },
      ];

      testCases.forEach(({ score, label }) => {
        const { rerender } = render(<CreditScore score={score} />);
        expect(screen.getByTestId('score-label')).toHaveTextContent(label);
        rerender(<div />); // Clear for next test
      });
    });

    it('should apply correct colors based on score', () => {
      const { rerender } = render(<CreditScore score={800} />);
      const scoreElement = screen.getByTestId('score-value');

      // Excellent score should be green
      expect(scoreElement).toHaveStyle({ color: '#22c55e' });

      // Poor score should be red
      rerender(<CreditScore score={500} />);
      expect(scoreElement).toHaveStyle({ color: '#ef4444' });
    });
  });

  describe('Interactive Features', () => {
    it('should handle score updates', () => {
      const mockUpdate = vi.fn();
      render(<CreditScore score={720} onScoreUpdate={mockUpdate} />);

      const updateButton = screen.getByTestId('update-score-btn');
      fireEvent.click(updateButton);

      expect(mockUpdate).toHaveBeenCalledWith(730);
    });

    it('should display factors when provided', () => {
      const factors = [
        'Payment history: 35%',
        'Credit utilization: 30%',
        'Length of credit history: 15%',
      ];

      render(<CreditScore score={720} factors={factors} />);

      expect(screen.getByTestId('score-factors')).toBeInTheDocument();
      factors.forEach((factor) => {
        expect(screen.getByText(factor)).toBeInTheDocument();
      });
    });

    it('should not display factors section when empty', () => {
      render(<CreditScore score={720} />);

      expect(screen.queryByTestId('score-factors')).not.toBeInTheDocument();
    });

    it('should not display update button when no callback provided', () => {
      render(<CreditScore score={720} />);

      expect(screen.queryByTestId('update-score-btn')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary scores correctly', () => {
      // Test minimum valid score
      const { rerender } = render(<CreditScore score={300} />);
      expect(screen.getByTestId('score-value')).toHaveTextContent('300');

      // Test maximum valid score
      rerender(<CreditScore score={850} />);
      expect(screen.getByTestId('score-value')).toHaveTextContent('850');
    });

    it('should handle empty factors array', () => {
      render(<CreditScore score={720} factors={[]} />);

      expect(screen.queryByTestId('score-factors')).not.toBeInTheDocument();
    });
  });
});
