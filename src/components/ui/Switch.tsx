import { Switch as HeadlessSwitch } from '@headlessui/react';
import clsx from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch = ({ checked, onChange, label, disabled = false }: SwitchProps) => {
  return (
    <div className="flex items-center">
      {label && (
        <label className="mr-3 text-sm font-medium text-gray-700">{label}</label>
      )}
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          {
            'bg-primary-600': checked,
            'bg-gray-200': !checked,
            'opacity-50 cursor-not-allowed': disabled,
          }
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            {
              'translate-x-6': checked,
              'translate-x-1': !checked,
            }
          )}
        />
      </HeadlessSwitch>
    </div>
  );
};

