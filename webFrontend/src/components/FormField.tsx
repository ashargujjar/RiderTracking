import type { ChangeEvent, InputHTMLAttributes } from "react";

export type FieldType = InputHTMLAttributes<HTMLInputElement>["type"] | "select" | "textarea";

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: readonly string[];
  fullWidth?: boolean;
  disabled?: boolean;
};

const inputClassName =
  "h-11 rounded-lg border border-border px-3 text-sm text-text-darker outline-none placeholder:text-gray focus:border-primary disabled:cursor-not-allowed disabled:bg-background disabled:text-gray";

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  options,
  fullWidth,
  disabled,
}: FormFieldProps) {
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    onChange(event.target.value);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <label className="text-xs font-semibold text-text-dark">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={3}
          className={`${inputClassName} h-auto resize-none py-2`}
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          className={inputClassName}
        >
          <option value="">Select...</option>
          {options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClassName}
        />
      )}
    </div>
  );
}
