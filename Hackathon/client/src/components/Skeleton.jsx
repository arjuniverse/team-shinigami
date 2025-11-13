export default function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    card: 'h-48 w-full',
    circle: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24',
  };

  return (
    <div
      className={`${variants[variant]} ${className} bg-gray-200 dark:bg-gray-700 animate-pulse rounded`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-4">
      <Skeleton variant="title" />
      <Skeleton variant="text" />
      <Skeleton variant="text" className="w-2/3" />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
}
