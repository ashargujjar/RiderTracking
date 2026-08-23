type SectionTabNavProps<T extends string> = {
  sections: { id: T; label: string }[];
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
          className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            activeId === section.id ? "bg-primary/10 text-primary" : "bg-background text-text-dark"
          }`}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
