import React from "react";
import ReactDOM from "react-dom/client";
import CreditScore from "./components/CreditScore";
import CreditScoreDisplay from "./components/CreditScore/CreditScoreDisplay";

function App() {
  const currentDate = new Date().toLocaleDateString();

  return (
    <div>
      <h1>AI-SDLC Framework Demo</h1>
      <CreditScore score={720} />
      <CreditScoreDisplay score={720} date={currentDate} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
