import { ReactNode } from 'react';

interface Props {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}

export function RailSection({ title, trailing, children }: Props) {
  return (
    <section className="flex flex-col gap-0.5">
      <header className="flex items-center justify-between px-2 pt-3 pb-1">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {title}
        </h3>
        {trailing}
      </header>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}
