import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface MultiSelectOption {
  value: string;
  label: string;
  image?: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect = ({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = 'Select items',
  searchPlaceholder = 'Search...',
  error,
  disabled = false,
  className,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];

  // Filter options based on search query
  const filteredOptions = (options || []).filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected options
  const selectedOptions = (options || []).filter((option) => safeValue.includes(option.value));

  // Handle option toggle
  const toggleOption = (optionValue: string) => {
    if (disabled) return;
    
    const newValue = safeValue.includes(optionValue)
      ? safeValue.filter((v) => v !== optionValue)
      : [...safeValue, optionValue];
    onChange(newValue);
  };

  // Handle remove option
  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(safeValue.filter((v) => v !== optionValue));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        {/* Selected items display */}
        <div
          className={clsx(
            'input min-h-[42px] flex items-center flex-wrap gap-2 cursor-pointer',
            {
              'border-red-300 focus-within:ring-red-500 focus-within:border-red-500': error,
              'bg-gray-50 cursor-not-allowed': disabled,
            }
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          {selectedOptions.length > 0 ? (
            <>
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-pink-100 text-pink-800"
                >
                  {option.image && (
                    <img
                      src={option.image}
                      alt={option.label}
                      className="w-4 h-4 rounded-full mr-1 object-cover"
                    />
                  )}
                  {option.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeOption(option.value, e)}
                      className="ml-1 text-pink-600 hover:text-pink-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
          <ChevronDownIcon
            className={clsx(
              'h-5 w-5 text-gray-400 ml-auto transition-transform',
              {
                'transform rotate-180': isOpen,
              }
            )}
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = safeValue.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={clsx(
                        'flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors',
                        {
                          'bg-blue-50': isSelected,
                        }
                      )}
                      onClick={() => toggleOption(option.value)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOption(option.value)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      {option.image && (
                        <img
                          src={option.image}
                          alt={option.label}
                          className="w-6 h-6 rounded-full mr-2 object-cover"
                        />
                      )}
                      <span className="text-sm text-gray-900 flex-1">{option.label}</span>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  No actors found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

