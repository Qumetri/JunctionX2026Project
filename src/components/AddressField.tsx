import { useCombobox } from 'downshift';
import { useEffect, useState, type Ref } from 'react';
import { searchAddresses, type AddressSuggestion } from '../../shared/opendata/photon';
import { Icon, type IconName } from './Icon';
import './AddressField.css';

const MIN_LENGTH = 3;
const DEBOUNCE_MS = 300;

type Results = { query: string; items: AddressSuggestion[]; failed: boolean };

/**
 * Address input with suggestions (C05: Downshift combobox + Photon). Searches wait for a short
 * pause in typing, answers to older text are dropped, and a picked suggestion is not searched
 * or listed again.
 */
export function AddressField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  inputRef,
  required,
  invalid,
  className,
}: {
  icon: IconName;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  required?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const [results, setResults] = useState<Results>({ query: '', items: [], failed: false });
  // The label of the suggestion just picked, or null while the user is typing.
  const [picked, setPicked] = useState<string | null>(null);
  const query = value.trim();
  const searchable = query.length >= MIN_LENGTH && query !== picked;
  const fresh = results.query === query;
  const items = searchable && fresh ? results.items : [];

  useEffect(() => {
    if (!searchable) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchAddresses(query, controller.signal)
        .then((found) => setResults({ query, items: found, failed: false }))
        .catch(() => {
          if (!controller.signal.aborted) setResults({ query, items: [], failed: true });
        });
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, searchable]);

  const { isOpen, highlightedIndex, getInputProps, getLabelProps, getMenuProps, getItemProps } =
    useCombobox<AddressSuggestion>({
      items,
      itemToString: (item) => item?.label ?? '',
      inputValue: value,
      selectedItem: null,
      onInputValueChange: ({ inputValue, type, selectedItem }) => {
        const isPick =
          type === useCombobox.stateChangeTypes.ItemClick ||
          type === useCombobox.stateChangeTypes.InputKeyDownEnter;
        setPicked(isPick ? (selectedItem?.label ?? null) : null);
        onChange(inputValue ?? '');
      },
      // Escape and leaving the field keep the typed text. By default Escape clears it and blur
      // picks the highlighted suggestion.
      stateReducer: (state, { type, changes }) =>
        type === useCombobox.stateChangeTypes.InputBlur ||
        type === useCombobox.stateChangeTypes.InputKeyDownEscape
          ? { ...changes, inputValue: state.inputValue, selectedItem: null }
          : changes,
    });

  const status = !searchable
    ? ''
    : !fresh
      ? 'Searching…'
      : results.failed
        ? 'Address search is unavailable right now'
        : items.length === 0
          ? 'No matching addresses in Finland'
          : '';

  return (
    <div className={className ? `address-field ${className}` : 'address-field'}>
      <div className="address-field__box">
        <div className="field">
          <Icon name={icon} className="field__icon" />
          <label {...getLabelProps()} className="field__label">
            {label}
          </label>
          <input
            {...getInputProps({
              ref: inputRef,
              placeholder,
              required,
              autoComplete: 'off',
              'aria-invalid': invalid,
            })}
          />
        </div>
        <ul
          {...getMenuProps()}
          className={
            isOpen && items.length > 0 ? 'address-field__menu' : 'address-field__menu is-hidden'
          }
        >
          {isOpen &&
            items.map((item, index) => (
              <li
                key={item.label}
                {...getItemProps({ item, index })}
                className={highlightedIndex === index ? 'is-active' : undefined}
              >
                {item.label}
              </li>
            ))}
        </ul>
      </div>
      <small className="address-field__status" aria-live="polite">
        {status}
      </small>
    </div>
  );
}
