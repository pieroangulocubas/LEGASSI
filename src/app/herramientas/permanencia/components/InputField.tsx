export function InputField({
  label,
  id,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
  autoComplete,
  readOnly,
  helperText,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  autoComplete?: string
  readOnly?: boolean
  helperText?: string
}) {
  return (
    <div className="space-y-1.5" suppressHydrationWarning>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        readOnly={readOnly}
        suppressHydrationWarning
        className={`block w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
          readOnly
            ? "border-input bg-muted text-muted-foreground cursor-default focus:ring-0 focus:border-input"
            : "border-input bg-input focus:ring-2 focus:ring-ring/50 focus:border-ring"
        }`}
      />
      {helperText && (
        <p className="text-xs text-muted-foreground leading-snug">{helperText}</p>
      )}
    </div>
  )
}
