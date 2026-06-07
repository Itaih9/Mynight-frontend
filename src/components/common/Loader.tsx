import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
}

export const Loader = ({ size = 'md', text }: LoaderProps) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div
        className={cn(
          'rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin',
          sizeClasses[size]
        )}
      />
      {text && (
        <p className={cn('mt-6 font-semibold text-slate-700 tracking-tight', textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
};
