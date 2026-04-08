interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export default function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h4>{title}</h4>
      <p>{subtitle}</p>
    </div>
  );
}
