export function SkeletonPulse({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: 'var(--color-border)' }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`rounded-xl border p-6 ${className}`}
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <SkeletonPulse className="h-6 w-1/3 mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl border p-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <SkeletonPulse className="h-4 w-1/2 mb-2" />
          <SkeletonPulse className="h-8 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-4 mb-6">
        <SkeletonPulse className="w-16 h-16 rounded-full" />
        <div className="flex-1">
          <SkeletonPulse className="h-6 w-1/3 mb-2" />
          <SkeletonPulse className="h-4 w-1/4" />
        </div>
      </div>
      <SkeletonStats />
    </div>
  );
}
