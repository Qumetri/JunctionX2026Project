import { Icon, type IconName } from '../components/Icon';
import { LiquidMeter } from '../components/LiquidMeter';
import './EventPage.css';
import './MemberBenefitsPage.css';

const membership = {
  level: 'Annual Member',
  activeUntil: 'June 2027',
  points: 1280,
  unlocked: 8,
  total: 10,
};

const benefits: { icon: IconName; title: string; text: string }[] = [
  { icon: 'wrench', title: 'Free tool rental', text: 'For moving and home tasks' },
  { icon: 'heart', title: 'Free remote vet sessions', text: 'For pet health support' },
  { icon: 'tag', title: 'Partner discounts', text: 'On verified movers, vets and travel services' },
  { icon: 'clock', title: 'Priority service', text: 'Faster access to recommended partners' },
];

const tiers = [
  { id: 'basic', name: 'Basic', text: 'Risk insights and recommended actions' },
  { id: 'member', name: 'Member', text: 'Free tools, free vet sessions and discounts' },
  { id: 'annual', name: 'Annual Member', text: 'All benefits and priority support' },
];

export function MemberBenefitsPage() {
  const unlockedPercent = Math.round((membership.unlocked / membership.total) * 100);

  return (
    <>
      <section className="event-hero" aria-labelledby="benefits-page-title">
        <div className="event-hero__inner">
          <h1 id="benefits-page-title">Member benefits — More support for your big decisions</h1>
          <p className="event-hero__lead">
            Annual members get free tool rental, free remote vet sessions and partner discounts
            across the If ecosystem.
          </p>

          <div className="membership-top">
            <article className="membership-card">
              <div className="membership-card__head">
                <h2>Your membership</h2>
                <span className="membership-card__badge" aria-hidden="true">
                  <Icon name="heart" />
                </span>
              </div>
              <dl className="membership-card__facts">
                <div>
                  <dt>Level</dt>
                  <dd>{membership.level}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>Active until {membership.activeUntil}</dd>
                </div>
                <div>
                  <dt>Points</dt>
                  <dd>{membership.points.toLocaleString('en-GB')}</dd>
                </div>
                <div>
                  <dt>Benefits unlocked</dt>
                  <dd>
                    {membership.unlocked} of {membership.total}
                  </dd>
                </div>
              </dl>
              <LiquidMeter value={unlockedPercent} variant="progress" label="Benefits unlocked" />
            </article>

            <ul className="benefit-grid">
              {benefits.map((benefit) => (
                <li className="benefit-card" key={benefit.title}>
                  <span className="icon-tile icon-tile--small">
                    <Icon name={benefit.icon} />
                  </span>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="event-body">
        <section aria-labelledby="comparison-title">
          <h2 id="comparison-title" className="membership-section-title">
            Membership comparison
          </h2>
          <ol className="tier-strip">
            {tiers.map((tier) => {
              const current = tier.name === membership.level;
              return (
                <li
                  className={current ? 'tier tier--current' : 'tier'}
                  key={tier.id}
                  aria-current={current ? 'true' : undefined}
                >
                  <h3>
                    <Icon name="check" className="tier__icon" />
                    {tier.name}
                    {current && <span className="tier__you">Your level</span>}
                  </h3>
                  <p>{tier.text}</p>
                </li>
              );
            })}
          </ol>
          <p className="membership-note">
            On top of this, If customers get 10% off qualifying insurance with one policy, and 15%
            with two or more.
          </p>
        </section>
      </div>
    </>
  );
}
