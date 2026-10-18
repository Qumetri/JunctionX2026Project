import { useRef, useState } from 'react';
import { useCombobox } from 'downshift';
import { useDropzone } from 'react-dropzone';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  Checkbox,
  CheckboxGroup,
  ComboBox,
  DateInput,
  DateSegment,
  DatePicker,
  Dialog,
  Group,
  Heading,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  NumberField,
  Popover,
  Radio,
  RadioGroup,
  Select,
  SelectValue,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  Switch,
  Tag,
  TagGroup,
  TagList,
  ToggleButton,
  ToggleButtonGroup,
} from 'react-aria-components';
import { Demo } from '../components/Demo';

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

/* C01 Date picker */
function DatePickerDemo() {
  return (
    <DatePicker className="field" aria-label="Move date">
      <Label className="field__label">Move date</Label>
      <Group className="field__control">
        <span className="field__icon">
          <CalendarIcon />
        </span>
        <DateInput style={{ display: 'flex', flex: 1 }}>
          {(segment) => <DateSegment segment={segment} className="date-segment" />}
        </DateInput>
        <Button aria-label="Open calendar" className="btn btn--ghost">
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
            <CalendarGrid>{(date) => <CalendarCell date={date} className="calendar-cell" />}</CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  );
}

/* C02 Select */
function SelectDemo() {
  return (
    <Select className="field" placeholder="Choose">
      <Label className="field__label">Home type</Label>
      <Button className="field__control select-btn">
        <span className="field__icon">
          <TruckIcon />
        </span>
        <SelectValue className="select-value" />
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
  );
}

/* C03 Number field */
function NumberDemo() {
  return (
    <NumberField defaultValue={2} minValue={1} maxValue={10} className="field">
      <Label className="field__label">Rooms to pack</Label>
      <Group className="field__control">
        <Button slot="decrement" className="btn" aria-label="Fewer">−</Button>
        <Input style={{ textAlign: 'center' }} />
        <Button slot="increment" className="btn" aria-label="More">+</Button>
      </Group>
    </NumberField>
  );
}

/* C04 Switch */
function SwitchDemo() {
  const [notify, setNotify] = useState(true);
  return (
    <Switch isSelected={notify} onChange={setNotify}>
      Remind me 14 days before the move ({notify ? 'on' : 'off'})
    </Switch>
  );
}

/* C05 Location autocomplete (Downshift + Photon) */
const PHOTON_URL = 'https://photon.komoot.io/api/?limit=5&q=';

function LocationDemo() {
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
            [f.properties.name, f.properties.city, f.properties.country].filter(Boolean).join(', '),
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
            <li key={`${item}-${index}`} {...getItemProps({ item, index })} aria-selected={highlightedIndex === index}>
              {item}
            </li>
          ))}
      </ul>
      {status && <small className="field__label">{status}</small>}
    </div>
  );
}

/* C06 Tag / chip input */
type TagItem = { id: string; name: string };

function TagDemo() {
  const [tags, setTags] = useState<TagItem[]>([{ id: 'pets', name: 'Pets' }]);
  const [draft, setDraft] = useState('');
  const add = () => {
    const name = draft.trim();
    if (!name) return;
    setTags((t) => [...t, { id: `${name}-${Date.now()}`, name }]);
    setDraft('');
  };
  return (
    <div className="field">
      <TagGroup aria-label="Household" onRemove={(keys) => setTags((t) => t.filter((x) => !keys.has(x.id)))}>
        <Label className="field__label">Who is moving with you?</Label>
        <TagList items={tags} className="tag-list">
          {(item) => (
            <Tag id={item.id} textValue={item.name} className="tag">
              {item.name}
              <Button slot="remove" aria-label={`Remove ${item.name}`} className="tag__remove">
                ×
              </Button>
            </Tag>
          )}
        </TagList>
      </TagGroup>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a name and press Enter" className="tag-input" aria-label="Add tag" />
        <Button type="submit" className="btn">
          Add
        </Button>
      </form>
    </div>
  );
}

/* C07 Rating */
function RatingDemo() {
  const [score, setScore] = useState(3);
  return (
    <div className="row">
      <div role="group" aria-label="Rating" className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={n <= score}
            className={n <= score ? 'star is-on' : 'star'}
            onClick={() => setScore(n)}
          >
            ★
          </button>
        ))}
      </div>
      <span>{score} of 5</span>
    </div>
  );
}

/* C08 Stepper / wizard */
const STEPS = ['Dates', 'Home', 'Movers', 'Confirm'];

function StepperDemo() {
  const [step, setStep] = useState(0);
  return (
    <>
      <ol className="stepper" aria-label="Move setup steps">
        {STEPS.map((name, i) => (
          <li key={name} className={i < step ? 'is-done' : i === step ? 'is-current' : undefined} aria-current={i === step ? 'step' : undefined}>
            <span className="stepper__dot">{i < step ? '✓' : i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <div className="row">
        <button className="btn" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
        <button className="btn btn--primary" disabled={step === STEPS.length} onClick={() => setStep((s) => s + 1)}>
          {step === STEPS.length - 1 ? 'Finish' : step === STEPS.length ? 'Done' : 'Next'}
        </button>
      </div>
    </>
  );
}

/* C09 File drop */
function FileDropDemo() {
  const [files, setFiles] = useState<string[]>([]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    onDrop: (accepted) => setFiles((f) => [...f, ...accepted.map((x) => x.name)]),
  });
  return (
    <div>
      <div {...getRootProps({ className: `dropzone${isDragActive ? ' is-active' : ''}` })}>
        <input {...getInputProps()} />
        <p>{isDragActive ? 'Drop to upload' : 'Drag a lease or photo here, or click to choose'}</p>
        <small>PDF, PNG or JPG</small>
      </div>
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((name, i) => (
            <li key={`${name}-${i}`}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* C10 OTP code input */
function OtpDemo() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const entered = digits.join('').length;
  const set = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div className="field">
      <div className="otp" role="group" aria-label="6-digit code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            }}
          />
        ))}
      </div>
      <small className="field__label">{entered === 6 ? 'Code complete' : `${entered}/6 entered`}</small>
    </div>
  );
}

/* C11 Password strength meter */
function PasswordDemo() {
  const [pw, setPw] = useState('');
  const score = [
    pw.length >= 8,
    pw.length >= 12,
    /[A-Z]/.test(pw) && /[a-z]/.test(pw),
    /\d/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  return (
    <div className="field">
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="tag-input" aria-label="Choose a password" />
      <div className="segments" role="meter" aria-label="Password strength" aria-valuemin={0} aria-valuemax={5} aria-valuenow={score}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={i < score ? 'is-on' : undefined} />
        ))}
      </div>
      <small className="field__label">{labels[score]}</small>
    </div>
  );
}

/* C12 Checkbox group with select-all */
const DOCS = [
  { id: 'passport', label: 'Passport or ID' },
  { id: 'lease', label: 'Lease or contract' },
  { id: 'photos', label: 'Photos of the rooms' },
];

function CheckboxDemo() {
  const all = DOCS.map((d) => d.id);
  const [value, setValue] = useState<string[]>(['passport']);
  const isAll = value.length === all.length;
  const isSome = value.length > 0 && !isAll;
  return (
    <div className="stack">
      <Checkbox isSelected={isAll} isIndeterminate={isSome} onChange={(s) => setValue(s ? all : [])} className="check">
        <span className="check__box" aria-hidden="true" />
        Select all
      </Checkbox>
      <CheckboxGroup value={value} onChange={setValue} aria-label="Documents to bring">
        {DOCS.map((d) => (
          <Checkbox key={d.id} value={d.id} className="check">
            <span className="check__box" aria-hidden="true" />
            {d.label}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  );
}

/* C13 Radio option cards */
const TRANSPORT = [
  { id: 'car', name: 'Car', note: 'Up to 2 boxes' },
  { id: 'van', name: 'Small van', note: 'Up to 10 boxes' },
  { id: 'truck', name: 'Truck', note: 'Full household' },
];

function RadioCardsDemo() {
  return (
    <RadioGroup defaultValue="van" aria-label="Transport" className="radio-cards">
      {TRANSPORT.map((t) => (
        <Radio key={t.id} value={t.id} className="radio-card">
          <strong>{t.name}</strong>
          <span>{t.note}</span>
        </Radio>
      ))}
    </RadioGroup>
  );
}

/* C14 Range slider (budget) */
function BudgetSliderDemo() {
  const [budget, setBudget] = useState(300);
  return (
    <Slider value={[budget]} onChange={(v) => setBudget(v[0])} minValue={0} maxValue={1000} step={50} className="slider">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Label>Moving budget (EUR)</Label>
        <SliderOutput />
      </div>
      <SliderTrack className="slider__track">
        <SliderThumb className="slider__thumb" />
      </SliderTrack>
    </Slider>
  );
}

/* C15 Segmented control */
function SegmentedDemo() {
  return (
    <ToggleButtonGroup selectionMode="single" disallowEmptySelection defaultSelectedKeys={['car']} aria-label="Transport" className="segmented">
      {[
        { id: 'car', label: 'Car' },
        { id: 'van', label: 'Van' },
        { id: 'bike', label: 'Bike' },
      ].map((o) => (
        <ToggleButton key={o.id} id={o.id} className="segmented__btn">
          {o.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/* C16 Searchable combobox */
const COUNTRIES = ['Finland', 'Estonia', 'Sweden', 'Norway', 'Denmark', 'Germany', 'Latvia', 'Lithuania'];

function ComboDemo() {
  return (
    <ComboBox className="field" aria-label="Country of origin">
      <Label className="field__label">Country of origin</Label>
      <div className="field__control">
        <Input placeholder="Type a country" className="tag-input" />
        <Button className="btn btn--ghost">▾</Button>
      </div>
      <Popover className="popover">
        <ListBox className="listbox">
          {COUNTRIES.map((c) => (
            <ListBoxItem key={c} id={c} textValue={c} className="listbox-item">
              {c}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}

/* C17 Validated text field */
function ValidatedFieldDemo() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showError = touched && !valid;
  return (
    <label className="field">
      <span className="field__label">Email for move reminders</span>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={showError}
        aria-describedby="email-msg"
        className="tag-input"
      />
      <small id="email-msg" className={showError ? 'field__error' : 'field__label'}>
        {showError ? 'Enter an email like name@example.com' : valid ? 'Looks good' : 'We only use this for reminders'}
      </small>
    </label>
  );
}

export function FormsGroup() {
  return (
    <>
      <Demo id="C01" title="Date picker" lib="react-aria-components DatePicker">
        <DatePickerDemo />
      </Demo>
      <Demo id="C02" title="Select" lib="react-aria-components Select">
        <SelectDemo />
      </Demo>
      <Demo id="C03" title="Number field" lib="react-aria-components NumberField">
        <NumberDemo />
      </Demo>
      <Demo id="C04" title="Switch" lib="react-aria-components Switch">
        <SwitchDemo />
      </Demo>
      <Demo id="C05" title="Location autocomplete" lib="downshift combobox + Photon (OSM, needs network)">
        <LocationDemo />
      </Demo>
      <Demo id="C06" title="Tag / chip input" lib="react-aria-components TagGroup">
        <TagDemo />
      </Demo>
      <Demo id="C07" title="Rating" lib="plain buttons, aria-pressed">
        <RatingDemo />
      </Demo>
      <Demo id="C08" title="Stepper / wizard" lib="plain state + CSS">
        <StepperDemo />
      </Demo>
      <Demo id="C09" title="File drop" lib="react-dropzone">
        <FileDropDemo />
      </Demo>
      <Demo id="C10" title="OTP code input" lib="plain inputs, auto-advance">
        <OtpDemo />
      </Demo>
      <Demo id="C11" title="Password strength meter" lib="plain CSS segments">
        <PasswordDemo />
      </Demo>
      <Demo id="C12" title="Checkbox group with select-all" lib="react-aria-components Checkbox, CheckboxGroup">
        <CheckboxDemo />
      </Demo>
      <Demo id="C13" title="Radio option cards" lib="react-aria-components RadioGroup">
        <RadioCardsDemo />
      </Demo>
      <Demo id="C14" title="Budget range slider" lib="react-aria-components Slider">
        <BudgetSliderDemo />
      </Demo>
      <Demo id="C15" title="Segmented control" lib="react-aria-components ToggleButtonGroup">
        <SegmentedDemo />
      </Demo>
      <Demo id="C16" title="Searchable combobox" lib="react-aria-components ComboBox">
        <ComboDemo />
      </Demo>
      <Demo id="C17" title="Validated text field" lib="plain input, live validation on blur">
        <ValidatedFieldDemo />
      </Demo>
    </>
  );
}
