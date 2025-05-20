
import React from 'react';
import { Star, StarHalf, StarOff } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  className?: string;
  onChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  color = "gold",
  className = "",
  onChange
}) => {
  // Ensure rating is between 0 and maxRating
  const safeRating = Math.min(Math.max(0, rating), maxRating);
  
  const handleClick = (index: number) => {
    if (onChange) {
      // If clicking the same star that's already selected, toggle off
      const newRating = rating === index ? 0 : index;
      onChange(newRating);
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1;
        
        // Interactive star when onChange is provided
        if (onChange) {
          return (
            <button
              key={`star-${index}`}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110"
              onClick={() => handleClick(starValue)}
              aria-label={`Rate ${starValue} of ${maxRating}`}
            >
              {starValue <= safeRating ? (
                <Star fill={color} color={color} size={size} />
              ) : (
                <StarOff size={size} />
              )}
            </button>
          );
        }
        
        // Read-only star display
        return (
          <span key={`star-${index}`}>
            {starValue <= safeRating ? (
              <Star fill={color} color={color} size={size} />
            ) : (
              <StarOff size={size} opacity={0.5} />
            )}
          </span>
        );
      })}
    </div>
  );
};
