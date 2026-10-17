import type { ReactNode } from 'react';
import type { Level } from '../../shared/types';
import { Icon, type IconName } from './Icon';
import { LiquidMeter } from './LiquidMeter';
import './blocks.css';

/** Input with a leading icon; the label sits inside the box above the value, as in the designs. */
export function Field({
  icon,
  label,
  children,
  className,
}: {
  icon: IconName;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className ? `field ${className}` : 'field'}>
      <Icon name={icon} className="field__icon" />
      <span className="field__label">{label}</span>
      {children}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true" />
      {label}
    </label>
  );
}

const levelLabel: Record<Level, string> = { low: 'Low', medium: 'Medium', high: 'High' };

/** "Transport damage: Medium" rows used in the preview cards. */
export function RiskRows({
  rows,
}: {
  rows: { id: string; name: string; level: Level; icon: IconName; handled?: boolean }[];
}) {
  return (
    <ul className="risk-rows">
      {rows.map((row) => (
        <li key={row.id}>
          <Icon name={row.icon} className="risk-rows__icon" />
          <span className="risk-rows__name">{row.name}</span>
          <span
            className={`risk-rows__level risk-rows__level--${row.handled ? 'handled' : row.level}`}
          >
            {row.handled ? 'Handled' : levelLabel[row.level]}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ServiceCard({
  icon,
  title,
  children,
  action,
}: {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action: ReactNode;
}) {
  return (
    <article className="service-tile">
      <h3 className="service-tile__title">
        <span className="icon-tile icon-tile--small">
          <Icon name={icon} />
        </span>
        {title}
      </h3>
      {children && <div className="service-tile__body">{children}</div>}
      <div className="service-tile__action">{action}</div>
    </article>
  );
}

/** A titled row of tickable items with a liquid progress bar. */
export function Checklist({
  id,
  title,
  items,
  done,
  onToggle,
}: {
  id: string;
  title: string;
  items: { id: string; label: string; hint?: string }[];
  done: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  const doneCount = items.filter((item) => done.has(item.id)).length;
  const percent = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);

  return (
    <section className="checklist" id={id} aria-labelledby={`${id}-title`}>
      <div className="checklist__head">
        <h2 id={`${id}-title`}>{title}</h2>
        <div className="checklist__progress">
          <span>
            {doneCount} of {items.length} done
          </span>
          <LiquidMeter value={percent} variant="progress" label={`${title} progress`} />
        </div>
      </div>
      <ul className="checklist__items">
        {items.map((item) => (
          <li key={item.id}>
            <label className="check-item">
              <input
                type="checkbox"
                checked={done.has(item.id)}
                onChange={() => onToggle(item.id)}
              />
              <span className="check-item__text">
                {item.label}
                {item.hint && <span className="check-item__hint">{item.hint}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
