import React from 'react';

export default function WizardProgress({ currentStep, totalSteps, stepLabels }) {
  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      {/* Step label */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-500">Step {currentStep} of {totalSteps}</span>
        <span className="text-xs text-slate-500">{stepLabels[currentStep - 1]}</span>
      </div>
      {/* Bar */}
      <div className="w-full h-1.5 bg-[#2A2A3A] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#7B3BFF] to-[#C084FC] rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      {/* Dots */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              i + 1 <= currentStep ? 'bg-[#7B3BFF]' : 'bg-[#2A2A3A]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}