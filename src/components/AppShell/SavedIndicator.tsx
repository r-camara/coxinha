interface Props {
  label: string;
}

export function SavedIndicator({ label }: Props) {
  return (
    <div className="flex items-center gap-1.5 cx-status">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: 'oklch(var(--accent))' }}
        aria-hidden="true"
      />
      {label}
    </div>
  );
}
