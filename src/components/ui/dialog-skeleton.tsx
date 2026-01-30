import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DialogSkeletonProps {
  /** Number of text lines to show */
  lines?: number;
  /** Show a header skeleton */
  showHeader?: boolean;
  /** Show action buttons skeleton */
  showActions?: boolean;
  /** Show an avatar/image skeleton */
  showAvatar?: boolean;
  /** Custom className */
  className?: string;
}

export function DialogSkeleton({
  lines = 4,
  showHeader = true,
  showActions = true,
  showAvatar = false,
  className,
}: DialogSkeletonProps) {
  return (
    <div className={cn("space-y-4 animate-fade-in", className)}>
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {showAvatar && (
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>

      {showActions && (
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}

interface FormSkeletonProps {
  /** Number of form fields to show */
  fields?: number;
  /** Custom className */
  className?: string;
}

export function FormSkeleton({ fields = 4, className }: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

interface TableSkeletonProps {
  /** Number of rows to show */
  rows?: number;
  /** Number of columns to show */
  columns?: number;
  /** Custom className */
  className?: string;
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("space-y-3 animate-fade-in", className)}>
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={cn(
                "h-4 flex-1",
                colIndex === 0 && "w-1/4"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  /** Show image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Custom className */
  className?: string;
}

export function CardSkeleton({ showImage = true, lines = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-lg border p-4 space-y-4 animate-fade-in", className)}>
      {showImage && <Skeleton className="h-40 w-full rounded-md" />}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-3", i === lines - 1 ? "w-1/2" : "w-full")}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

interface ProfileSkeletonProps {
  /** Show cover image */
  showCover?: boolean;
  /** Custom className */
  className?: string;
}

export function ProfileSkeleton({ showCover = true, className }: ProfileSkeletonProps) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      {showCover && <Skeleton className="h-32 w-full rounded-lg" />}
      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
