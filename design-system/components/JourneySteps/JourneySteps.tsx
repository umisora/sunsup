import Link from "next/link";
import { JOURNEY, JOURNEY_ORDER, type JourneyStep } from "../../journey";
import styles from "./JourneySteps.module.css";

export function JourneySteps({ current }: { current: JourneyStep }) {
  return (
    <nav aria-label="場と一杯" data-intro>
      <ol className={styles.steps}>
        {JOURNEY_ORDER.map((step) => (
          <li key={step}>
            <Link href={JOURNEY[step].href} className={styles.item} aria-current={step === current ? "step" : undefined}>
              <span className={styles.no}>{JOURNEY[step].no}</span>
              <span>{JOURNEY[step].label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
