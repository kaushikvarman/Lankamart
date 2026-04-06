import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function Rating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  className,
}: RatingProps) {
  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    const filled = i <= Math.floor(rating);
    const halfFilled = i === Math.ceil(rating) && rating % 1 !== 0;

    stars.push(
      <div key={i} className="relative">
        <Star
          className={cn(sizeStyles[size], 'text-slate-300')}
          fill="currentColor"
        />
        {(filled || halfFilled) && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: halfFilled ? '50%' : '100%' }}
          >
            <Star
              className={cn(sizeStyles[size], 'text-yellow-400')}
              fill="currentColor"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">{stars}</div>
      {showValue && (
        <span className="text-sm text-slate-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
