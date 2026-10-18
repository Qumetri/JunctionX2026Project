import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TextareaAutosize from 'react-textarea-autosize';
import PhoneInput, { isValidPhoneNumber, type Value } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { InputMask } from '@react-input/mask';
import { NumericFormat } from 'react-number-format';
import { Demo } from '../components/Demo';

/* C60 Phone number input (Finland by default, for SMS reminders) */
function PhoneDemo() {
  const [phone, setPhone] = useState<Value | undefined>();
  const complete = phone ? isValidPhoneNumber(phone) : false;
  return (
    <div className="field">
      <label className="field__label" htmlFor="b3-phone">
        Phone for move reminders
      </label>
      <PhoneInput
        international
        defaultCountry="FI"
        value={phone}
        onChange={setPhone}
        className="b3-phone"
        numberInputProps={{ id: 'b3-phone', className: 'b3-input' }}
      />
      <p className="b3-hint">
        {!phone
          ? 'We text you 3 days before the move. Finland (+358) is the default.'
          : complete
            ? `Saved as ${phone}`
            : 'Keep typing, the number is not complete yet.'}
      </p>
    </div>
  );
}

/* C61 Input mask (date and Finnish postal code) */
function MaskDemo() {
  const [date, setDate] = useState('');
  const [zip, setZip] = useState('');
  const dateDone = /^\d{2}\.\d{2}\.\d{4}$/.test(date);
  return (
    <div className="b3-grid-2">
      <label className="field">
        <span className="field__label">Move date</span>
        <InputMask
          className="b3-input"
          mask="dd.mm.yyyy"
          replacement={{ d: /\d/, m: /\d/, y: /\d/ }}
          showMask
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <span className="b3-hint">{dateDone ? 'Valid format' : 'Type as DD.MM.YYYY'}</span>
      </label>
      <label className="field">
        <span className="field__label">Postal code (new address)</span>
        <InputMask
          className="b3-input"
          mask="_____"
          replacement={{ _: /\d/ }}
          showMask
          value={zip}
          onChange={(e) => setZip(e.target.value)}
        />
        <span className="b3-hint">
          {zip.length === 5 ? 'Five digits, Finnish format' : 'Five digits'}
        </span>
      </label>
    </div>
  );
}

/* C62 Formatted numbers (EUR budget and m2) */
function NumberFormatDemo() {
  const [budget, setBudget] = useState<number | undefined>(4500);
  const [area, setArea] = useState<number | undefined>(72);
  return (
    <div className="b3-grid-2">
      <label className="field">
        <span className="field__label">Moving budget</span>
        <NumericFormat
          className="b3-input"
          value={budget}
          thousandSeparator={' '}
          decimalScale={0}
          suffix=" €"
          allowNegative={false}
          onValueChange={(v) => setBudget(v.floatValue)}
        />
      </label>
      <label className="field">
        <span className="field__label">Home size</span>
        <NumericFormat
          className="b3-input"
          value={area}
          thousandSeparator={' '}
          decimalScale={1}
          suffix=" m²"
          allowNegative={false}
          onValueChange={(v) => setArea(v.floatValue)}
        />
      </label>
      <p className="b3-hint" style={{ gridColumn: '1 / -1' }}>
        Budget per m²: {budget && area ? Math.round(budget / area).toLocaleString('fi-FI') : '-'} €
      </p>
    </div>
  );
}

/* C63 React Hook Form: "Plan your move" with built-in rules */
type MoveForm = { name: string; fromCity: string; toCity: string; rooms: number };

function MoveFormDemo() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MoveForm>({
    mode: 'onTouched',
    defaultValues: { name: '', fromCity: '', toCity: '', rooms: 2 },
  });
  const [saved, setSaved] = useState<MoveForm | null>(null);

  return (
    <form
      className="b3-stack"
      noValidate
      onSubmit={handleSubmit((data) => setSaved(data))}
      onReset={() => setSaved(null)}
    >
      <div className="b3-grid-2">
        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="b3-input"
            {...register('name', {
              required: 'Enter your name',
              minLength: { value: 2, message: 'At least 2 letters' },
            })}
          />
          {errors.name && <span className="field__error">{errors.name.message}</span>}
        </label>
        <label className="field">
          <span className="field__label">Rooms</span>
          <input
            className="b3-input"
            type="number"
            {...register('rooms', {
              valueAsNumber: true,
              min: { value: 1, message: 'At least 1 room' },
              max: { value: 12, message: 'Up to 12 rooms here' },
            })}
          />
          {errors.rooms && <span className="field__error">{errors.rooms.message}</span>}
        </label>
        <label className="field">
          <span className="field__label">From</span>
          <input
            className="b3-input"
            {...register('fromCity', { required: 'Where are you moving from?' })}
          />
          {errors.fromCity && <span className="field__error">{errors.fromCity.message}</span>}
        </label>
        <label className="field">
          <span className="field__label">To</span>
          <input className="b3-input" {...register('toCity', { required: 'Where to?' })} />
          {errors.toCity && <span className="field__error">{errors.toCity.message}</span>}
        </label>
      </div>
      <div className="row">
        <button type="submit" className="btn btn--primary">
          Save move plan
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            reset();
            setSaved(null);
          }}
        >
          Start over
        </button>
      </div>
      {saved && (
        <p className="b3-hint" role="status">
          Saved for {saved.name}: {saved.fromCity} to {saved.toCity}, {saved.rooms} room
          {saved.rooms === 1 ? '' : 's'}.
        </p>
      )}
    </form>
  );
}

/* C64 Zod schema on its own (live issue list) */
const quickMoveSchema = z.object({
  moveDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Use DD.MM.YYYY'),
  rooms: z.number().int().min(1, 'At least 1 room').max(12, 'Up to 12 rooms'),
  budgetEur: z
    .number()
    .min(0, 'Budget cannot be negative')
    .max(50000, 'Above 50 000 € needs an advisor'),
});

function ZodDemo() {
  const [moveDate, setMoveDate] = useState('14.11.2026');
  const [rooms, setRooms] = useState('3');
  const [budget, setBudget] = useState('3800');
  const result = quickMoveSchema.safeParse({
    moveDate,
    rooms: Number(rooms),
    budgetEur: Number(budget),
  });
  return (
    <div className="b3-stack">
      <div className="b3-grid-2">
        <label className="field">
          <span className="field__label">Move date</span>
          <input
            className="b3-input"
            value={moveDate}
            onChange={(e) => setMoveDate(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Rooms</span>
          <input className="b3-input" value={rooms} onChange={(e) => setRooms(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Budget (€)</span>
          <input className="b3-input" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </label>
      </div>
      {result.success ? (
        <div className="alert" role="status">
          Valid. The move plan can be saved.
        </div>
      ) : (
        <ul className="plain-list b3-issues" aria-live="polite">
          {result.error.issues.map((issue, i) => (
            <li key={i}>
              <code>{issue.path.map(String).join('.') || 'form'}</code> {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* C65 @hookform/resolvers: a Zod schema plugged into React Hook Form */
const travelSchema = z.object({
  destination: z.string().min(2, 'Enter a destination'),
  days: z.number().int().min(1, 'At least 1 day').max(180, 'Standard cover covers up to 180 days'),
  pet: z.boolean(),
  email: z.email('Enter a valid email'),
});
type TravelForm = z.infer<typeof travelSchema>;

function ResolverDemo() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TravelForm>({
    resolver: zodResolver(travelSchema),
    defaultValues: { destination: '', days: 7, pet: false, email: '' },
  });
  const [report, setReport] = useState<string | null>(null);

  return (
    <form
      className="b3-stack"
      noValidate
      onSubmit={handleSubmit((data) => {
        const level = data.days > 60 || data.pet ? 'medium' : 'low';
        setReport(
          `${data.destination}, ${data.days} days${data.pet ? ', with a pet' : ''}: risk ${level}. ` +
            `Summary sent to ${data.email}.`,
        );
      })}
    >
      <div className="b3-grid-2">
        <label className="field">
          <span className="field__label">Destination</span>
          <input className="b3-input" {...register('destination')} />
          {errors.destination && <span className="field__error">{errors.destination.message}</span>}
        </label>
        <label className="field">
          <span className="field__label">Trip length (days)</span>
          <input
            className="b3-input"
            type="number"
            {...register('days', { valueAsNumber: true })}
          />
          {errors.days && <span className="field__error">{errors.days.message}</span>}
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input className="b3-input" type="email" {...register('email')} />
          {errors.email && <span className="field__error">{errors.email.message}</span>}
        </label>
        <label className="b3-check">
          <input type="checkbox" {...register('pet')} /> Travelling with a pet
        </label>
      </div>
      <div className="row">
        <button type="submit" className="btn btn--primary">
          Run travel risk check
        </button>
      </div>
      {report && (
        <p className="b3-hint" role="status">
          {report}
        </p>
      )}
    </form>
  );
}

/* C66 Auto-growing textarea */
function AutosizeDemo() {
  const [notes, setNotes] = useState('');
  return (
    <label className="field">
      <span className="field__label">Anything else about the move? (pets, stairs, parking)</span>
      <TextareaAutosize
        className="b3-textarea"
        minRows={2}
        maxRows={6}
        maxLength={280}
        placeholder="Third floor, no lift. Cat needs a quiet room on moving day."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <span className="b3-hint">{notes.length}/280 characters</span>
    </label>
  );
}

export function DataEntryGroup() {
  return (
    <>
      <Demo id="C60" title="Phone number input" lib="react-phone-number-input">
        <PhoneDemo />
      </Demo>
      <Demo id="C61" title="Input mask (date, postal code)" lib="@react-input/mask">
        <MaskDemo />
      </Demo>
      <Demo id="C62" title="Formatted numbers (EUR, m²)" lib="react-number-format">
        <NumberFormatDemo />
      </Demo>
      <Demo id="C63" title="Plan your move form" lib="react-hook-form">
        <MoveFormDemo />
      </Demo>
      <Demo id="C64" title="Zod schema with live issues" lib="zod">
        <ZodDemo />
      </Demo>
      <Demo
        id="C65"
        title="Travel risk check with Zod resolver"
        lib="@hookform/resolvers + react-hook-form"
      >
        <ResolverDemo />
      </Demo>
      <Demo id="C66" title="Auto-growing notes field" lib="react-textarea-autosize">
        <AutosizeDemo />
      </Demo>
    </>
  );
}
