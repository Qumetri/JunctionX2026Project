import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DatePicker,
  DateInput,
  DateSegment,
  Dialog,
  Heading,
  Label,
  ListBox,
  ListBoxItem,
  NumberField,
  Popover,
  Select,
  SelectValue,
  Switch,
  Group,
  Input,
} from 'react-aria-components';
import { useCombobox } from 'downshift';
import { useState } from 'react';

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

const PHOTON_URL = 'https://photon.komoot.io/api/?limit=5&q=';

function LocationAutocomplete() {
  const [items, setItems] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const { isOpen, getInputProps, getLabelProps, getMenuProps, getItemProps, highlightedIndex } =
    useCombobox<string>({
      items,
      onInputValueChange: async ({ inputValue }) => {
        const q = inputValue ?? '';
        if (q.length < 3) {
          setItems([]);
          setStatus('');
          return;
        }
        try {
          const res = await fetch(PHOTON_URL + encodeURIComponent(q));
          const json = (await res.json()) as {
            features: { properties: { name?: string; city?: string; country?: string } }[];
          };
          const names = json.features.map((f) =>
            [f.properties.name, f.properties.city, f.properties.country]
              .filter(Boolean)
              .join(', '),
          );
          setItems(names);
          setStatus(names.length ? '' : 'No matches');
        } catch {
          setItems([]);
          setStatus('Could not reach Photon (offline?)');
        }
      },
    });

  return (
    <div className="field">
      <label {...getLabelProps()} className="field__label">
        Moving from (type 3+ letters)
      </label>
      <div className="field__control">
        <span className="field__icon">
          <PinIcon />
        </span>
        <input {...getInputProps({ placeholder: 'e.g. Helsinki' })} style={{ flex: 1 }} />
      </div>
      <ul {...getMenuProps()} className={isOpen && items.length ? 'suggest-list' : undefined}>
        {isOpen &&
          items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              {...getItemProps({ item, index })}
              aria-selected={highlightedIndex === index}
            >
              {item}
            </li>
          ))}
      </ul>
      {status && <small className="field__label">{status}</small>}
    </div>
  );
}

export function FormFields() {
  const [notify, setNotify] = useState(true);

  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <DatePicker className="field" aria-label="Move date">
        <Label className="field__label">Move date</Label>
        <Group className="field__control">
          <span className="field__icon">
            <CalendarIcon />
          </span>
          <DateInput style={{ display: 'flex', flex: 1 }}>
            {(segment) => <DateSegment segment={segment} className="date-segment" />}
          </DateInput>
          <Button aria-label="Open calendar" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            ▾
          </Button>
        </Group>
        <Popover className="popover">
          <Dialog>
            <Calendar className="calendar">
              <header className="calendar-header">
                <Button slot="previous" aria-label="Previous month" className="btn">
                  ‹
                </Button>
                <Heading />
                <Button slot="next" aria-label="Next month" className="btn">
                  ›
                </Button>
              </header>
              <CalendarGrid>
                {(date) => <CalendarCell date={date} className="calendar-cell" />}
              </CalendarGrid>
            </Calendar>
          </Dialog>
        </Popover>
      </DatePicker>

      <Select className="field" placeholder="Choose">
        <Label className="field__label">Home type</Label>
        <Button className="field__control" style={{ justifyContent: 'space-between', color: 'inherit', font: 'inherit', cursor: 'pointer', width: '100%' }}>
          <span className="field__icon">
            <TruckIcon />
          </span>
          <SelectValue style={{ flex: 1, textAlign: 'left' }} />
          <span aria-hidden="true">▾</span>
        </Button>
        <Popover className="popover">
          <ListBox className="listbox">
            <ListBoxItem id="apartment" className="listbox-item">Apartment</ListBoxItem>
            <ListBoxItem id="house" className="listbox-item">House</ListBoxItem>
            <ListBoxItem id="studio" className="listbox-item">Studio</ListBoxItem>
          </ListBox>
        </Popover>
      </Select>

      <NumberField defaultValue={2} minValue={1} maxValue={10} className="field">
        <Label className="field__label">Rooms to pack</Label>
        <Group className="field__control">
          <Button slot="decrement" className="btn" aria-label="Fewer">−</Button>
          <Input style={{ textAlign: 'center' }} />
          <Button slot="increment" className="btn" aria-label="More">+</Button>
        </Group>
      </NumberField>

      <Switch isSelected={notify} onChange={setNotify} style={{ alignSelf: 'center' }}>
        Remind me 14 days before the move
      </Switch>

      <LocationAutocomplete />
    </div>
  );
}
