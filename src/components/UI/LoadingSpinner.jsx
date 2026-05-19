const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
};

const LoadingSpinner = ({
  label = 'Yükleniyor...',
  size = 'md',
  fullScreen = false,
  showLabel = true,
  className = '',
}) => {
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const content = (
    <div className={`flex items-center justify-center gap-3 text-slate-600 ${className}`}>
      <span
        aria-hidden="true"
        className={`${spinnerSize} animate-spin rounded-full border-slate-200 border-t-red-700`}
      />
      {showLabel && <span className="text-sm font-medium">{label}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        {content}
      </div>
    );
  }

  return (
    <div aria-live="polite" role="status">
      {content}
    </div>
  );
};

export default LoadingSpinner;
