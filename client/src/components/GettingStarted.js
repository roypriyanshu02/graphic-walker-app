import React, { useState } from 'react';

const GettingStarted = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Graphic Walker",
      content: "Create beautiful data visualizations and dashboards with ease. Let's get you started!",
      icon: (
        <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Upload Your Data",
      content: "Start by uploading a CSV file or selecting an existing dataset. Your data should have column headers for the best experience.",
      icon: (
        <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    {
      title: "Design Your Charts",
      content: "Go to the Design tab and drag fields from your data to create visualizations. Experiment with different chart types and encodings.",
      icon: (
        <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: "Save Your Dashboard",
      content: "Once you're happy with your charts, click 'Save Dashboard' to save your work. You can then view and manage your dashboards.",
      icon: (
        <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4a2 2 0 012-2h4a2 2 0 012 2v3a2 2 0 01-2 2H9z" />
        </svg>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-elevated max-w-md w-full mx-4 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-notion-200">
          <div className="flex items-center justify-between">
            <h2 className="heading-notion text-lg">Getting Started</h2>
            <button
              onClick={onClose}
              className="text-notion-400 hover:text-notion-600 transition-colors duration-150"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-accent-50 rounded-full flex items-center justify-center">
              {steps[currentStep].icon}
            </div>
            <h3 className="heading-notion text-base mb-2">{steps[currentStep].title}</h3>
            <p className="text-notion-secondary text-sm leading-relaxed">
              {steps[currentStep].content}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-150 ${
                  index === currentStep ? 'bg-accent-600' : 'bg-notion-200'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="btn-notion-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-notion-500">
              {currentStep + 1} of {steps.length}
            </span>

            {currentStep < steps.length - 1 ? (
              <button onClick={nextStep} className="btn-notion">
                Next
              </button>
            ) : (
              <button onClick={onClose} className="btn-notion">
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
