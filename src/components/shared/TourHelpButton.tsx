import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Floating Help Button Component
 * 
 * A reusable fixed bottom-right button that can trigger any action
 */

interface TourHelpButtonProps {
  onClick: () => void;
  tooltip?: string;
  ariaLabel?: string;
}

export const TourHelpButton: React.FC<TourHelpButtonProps> = ({ 
  onClick,
  tooltip = "Need help? Click to start the tour",
  ariaLabel = "Help - Start Tour"
}) => {
  return (
    <div 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
      style={{ zIndex: 100001 }}
    >
      <button
        onClick={onClick}
        className="btn btn-md sm:btn-lg btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        aria-label={ariaLabel}
        title={tooltip}
      >
        <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  );
};

export default TourHelpButton;