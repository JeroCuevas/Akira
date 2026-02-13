import { forwardRef } from 'react';

interface InputProps {
  label?: string;
  id?: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      id,
      name,
      type = 'text',
      placeholder,
      required = false,
      minLength,
      className = '',
      error,
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 font-bold font-brutal text-sm"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className={`
            w-full px-4 py-2
            border-2 border-black
            bg-white
            font-brutal
            focus:shadow-brutal
            focus:outline-none
            transition-shadow
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 font-brutal">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
