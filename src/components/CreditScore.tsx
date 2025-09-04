import React from "react";

interface CreditScoreProps {
  score: number;
  factors?: string[];
  onScoreUpdate?: (newScore: number) => void;
}

/**
 * CreditScore component for displaying FICO credit scores
 * Validates score range 300-850 per FCRA requirements
 */
export const CreditScore: React.FC<CreditScoreProps> = ({
  score,
  factors = [],
  onScoreUpdate,
}) => {
  // FCRA Section 604 - Validate score range
  const isValidScore = score >= 300 && score <= 850;

  if (!isValidScore) {
    throw new Error(`Invalid credit score: ${score}. Must be between 300-850.`);
  }

  const getScoreColor = (score: number): string => {
    if (score >= 740) return "#22c55e"; // Excellent - Green
    if (score >= 670) return "#3b82f6"; // Good - Blue
    if (score >= 580) return "#f59e0b"; // Fair - Orange
    return "#ef4444"; // Poor - Red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 740) return "Excellent";
    if (score >= 670) return "Good";
    if (score >= 580) return "Fair";
    return "Poor";
  };

  return (
    <div
      className="credit-score-container"
      data-testid="credit-score"
      style={{
        padding: "20px",
        border: "2px solid #e5e7eb",
        borderRadius: "8px",
        textAlign: "center",
        maxWidth: "300px",
      }}
    >
      <h2 style={{ margin: "0 0 10px 0", color: "#374151" }}>Credit Score</h2>

      <div
        className="score-display"
        style={{
          fontSize: "48px",
          fontWeight: "bold",
          color: getScoreColor(score),
          margin: "10px 0",
        }}
        data-testid="score-value"
      >
        {score}
      </div>

      <div
        className="score-label"
        style={{
          fontSize: "18px",
          color: getScoreColor(score),
          fontWeight: "600",
          margin: "5px 0 15px 0",
        }}
        data-testid="score-label"
      >
        {getScoreLabel(score)}
      </div>

      {factors.length > 0 && (
        <div className="score-factors" data-testid="score-factors">
          <h4 style={{ margin: "15px 0 10px 0", color: "#6b7280" }}>
            Key Factors:
          </h4>
          <ul style={{ textAlign: "left", color: "#6b7280", fontSize: "14px" }}>
            {factors.map((factor, index) => (
              <li key={index} style={{ margin: "5px 0" }}>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onScoreUpdate && (
        <button
          onClick={() => onScoreUpdate(score + 10)}
          style={{
            marginTop: "15px",
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          data-testid="update-score-btn"
        >
          Simulate Score Update
        </button>
      )}
    </div>
  );
};

export default CreditScore;
