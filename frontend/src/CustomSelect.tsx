import { useRef, useEffect, useState } from "react";

type CustomSelectProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

function CustomSelect({
  label,
  options,
  value,
  onChange,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
  if (!isOpen) return;

  function handleOutsideClick(event: MouseEvent) {
    if (
      selectRef.current &&
      !selectRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  document.addEventListener('mousedown', handleOutsideClick);
  document.addEventListener('keydown', handleEscape);

  return () => {
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('keydown', handleEscape);
  };
}, [isOpen]);

  return (
    <div className="custom-select" ref={selectRef}>
      <span className="custom-select-label">{label}</span>

      <button
        type="button"
        className="custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value}
        <span className={`custom-select-arrow ${isOpen ? 'is-open' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-select-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option === value}
              className={`custom-select-option ${
                option === value ? 'selected' : ''
              }`}
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;