interface SkeletonProps {
  height?: number;
}

export default function Skeleton({ height = 24 }: SkeletonProps) {
  return <div className="skeleton" style={{ height }} />;
}
