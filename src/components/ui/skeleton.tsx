import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };

// Re-export dialog skeletons for convenience
export { 
  DialogSkeleton, 
  FormSkeleton, 
  TableSkeleton, 
  CardSkeleton, 
  ProfileSkeleton 
} from './dialog-skeleton';
