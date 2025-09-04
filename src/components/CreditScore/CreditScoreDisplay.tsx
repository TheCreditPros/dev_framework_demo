import React from "react";

interface CreditScoreProps {
  score: number;
  date: string;
  isLoading?: boolean;
  onScoreClick?: (score: number) => void;
  className?: string;
  showTooltip?: boolean;
}

interface CreditScoreRange {
  range: string;
  color: string;
  description: string;
}

export const CreditScoreDisplay: React.FC<CreditScoreProps> = ({
  score,
  date,
  isLoading = false,
  onScoreClick,
  className = "",
  showTooltip = true,
}) => {
  // Validate FICO score range (300-850) - FCRA compliance requirement
  const validScore = Math.min(Math.max(score, 300), 850);
  const scoreRange = getScoreRange(validScore);

  // Accessibility and interaction handlers
  const handleClick = () => onScoreClick?.(validScore);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onScoreClick?.(validScore);
    }
  };

  if (isLoading) {
    return <CreditScoreSkeleton className={className} />;
  }

  return (
    <div
      className={`credit-score ${scoreRange.range.toLowerCase()} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onScoreClick ? 0 : -1}
      role={onScoreClick ? "button" : "text"}
      aria-label={`Credit score ${validScore}, ${scoreRange.range} range`}
      data-testid="credit-score-display"
    >
      <div className="score-container">
        <span
          className="score-value"
          style={{ color: scoreRange.color }}
          data-testid="credit-score-value"
        >
          {validScore}
        </span>
        <span className="score-range" data-testid="credit-score-range">
          {scoreRange.range}
        </span>
      </div>

      <div className="score-metadata">
        <span className="score-date" data-testid="credit-score-date">
          Updated: {formatDate(date)}
        </span>
        {showTooltip && (
          <div className="score-tooltip" data-testid="credit-score-tooltip">
            {scoreRange.description}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for FICO score categorization
function getScoreRange(score: number): CreditScoreRange {
  if (score >= 800) {
    return {
      range: "EXCELLENT",
      color: "#22c55e",
      description: "Excellent credit - best rates available",
    };
  }
  if (score >= 740) {
    return {
      range: "VERY_GOOD",
      color: "#84cc16",
      description: "Very good credit - favorable rates",
    };
  }
  if (score >= 670) {
    return {
      range: "GOOD",
      color: "#eab308",
      description: "Good credit - competitive rates",
    };
  }
  if (score >= 580) {
    return {
      range: "FAIR",
      color: "#f97316",
      description: "Fair credit - higher rates may apply",
    };
  }
  return {
    range: "POOR",
    color: "#ef4444",
    description: "Poor credit - limited options available",
  };
}

// Loading skeleton component
const CreditScoreSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={`credit-score-skeleton ${className}`}
    data-testid="credit-score-skeleton"
  >
    <div className="skeleton-score"></div>
    <div className="skeleton-date"></div>
  </div>
);

// Date formatting utility
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default CreditScoreDisplay;
