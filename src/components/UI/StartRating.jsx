const clampRating = (value) => {
  const numericValue = Number(value || 0);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.min(5, Math.max(0, numericValue));
};

const formatRating = (value) => {
  if (!value) {
    return 'Yeni';
  }

  if (Number.isInteger(value)) {
    return `${value}/5`;
  }

  return `${value.toFixed(1)}/5`;
};

const StarIcon = ({ className = '' }) => (
  <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.287 3.96c.299.921-.755 1.688-1.539 1.118l-3.366-2.447a1 1 0 00-1.176 0l-3.366 2.447c-.784.57-1.838-.197-1.539-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.075 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.274-3.96z" />
  </svg>
);

const StartRating = ({
  rating = 0,
  reviewCount = 0,
  className = '',
  interactive = false,
  disabled = false,
  onChange,
  showReviewCount = true,
}) => {
  const numericRating = clampRating(rating);
  const safeReviewCount = Number(reviewCount || 0);
  const isInteractive = interactive && typeof onChange === 'function';

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className="flex items-center gap-1" role={isInteractive ? 'radiogroup' : undefined}>
        {[1, 2, 3, 4, 5].map((starValue) => {
          const fillPercentage = isInteractive
            ? starValue <= numericRating
              ? 100
              : 0
            : Math.max(0, Math.min(100, (numericRating - (starValue - 1)) * 100));

          if (isInteractive) {
            return (
              <button
                key={starValue}
                aria-checked={numericRating === starValue}
                aria-label={`${starValue} yildiz ver`}
                className={`relative h-6 w-6 p-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer transition-transform hover:scale-110'}`}
                disabled={disabled}
                onClick={() => onChange(starValue)}
                role="radio"
                type="button"
              >
                <StarIcon className="h-6 w-6 text-slate-300" />
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
                  <StarIcon className="h-6 w-6 text-amber-500" />
                </span>
              </button>
            );
          }

          return (
            <span key={starValue} className="relative block h-5 w-5" role="img">
              <StarIcon className="h-5 w-5 text-slate-300" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
                <StarIcon className="h-5 w-5 text-amber-500" />
              </span>
            </span>
          );
        })}
      </div>

      <span className="font-semibold text-amber-700">{formatRating(numericRating)}</span>
      {showReviewCount && (
        <>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500">{safeReviewCount} yorum</span>
        </>
      )}
    </div>
  );
};

export default StartRating;