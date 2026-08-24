type SectionTabNavProps<T extends string> = {
  sections: { id: T; label: string; filled?: boolean }[];
  activeId: T;
  onSelect: (id: T) => void;
  className?: string;
};

export function SectionTabNav<T extends string>({
  sections,
  activeId,
  onSelect,
  className = "",
}: SectionTabNavProps<T>) {
  return (
    <div className={`flex gap-2 overflow-x-auto ${className}`}>
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSelect(section.id)}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            activeId === section.id ? "bg-primary/10 text-primary" : "bg-background text-text-dark"
          }`}
        >
          {section.label}
          {section.filled && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-label="Section has data" />}
        </button>
      ))}
    </div>
  );
}
