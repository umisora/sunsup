import type { SceneCountTable } from "@/lib/scenes";
import { bottleCounts } from "@/lib/shopping-list";
import styles from "./BottleCountTable.module.css";

/** Headcounts the early table prints. Counts come from `bottleCounts`. */
const HEADCOUNTS = [5, 10, 20, 30] as const;

/**
 * Static headcount table above the recommended list.
 * Words come from the scene. Cells are the calculator's bottles.
 */
export function BottleCountTable({ countTable }: { countTable: SceneCountTable }) {
  const rows = HEADCOUNTS.map((people) => bottleCounts(people));
  const [toastLabel, bigLabel, mealLabel] = countTable.breakdown;
  return (
    <div className={styles.block}>
      <table className={styles.table}>
        <caption id={countTable.headingId} className={styles.caption}>
          {countTable.title}
        </caption>
        <colgroup>
          <col className={styles.colPeople} />
          <col className={styles.colTotal} />
          <col className={styles.colKind} />
          <col className={styles.colKind} />
          <col className={styles.colKind} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={styles.peopleHead}>
              {countTable.headcountLabel}
            </th>
            <th scope="col" className={styles.totalHead}>
              合計
            </th>
            <th scope="col" className={styles.kindHead}>
              {toastLabel}
            </th>
            <th scope="col" className={styles.kindHead}>
              {bigLabel}
            </th>
            <th scope="col" className={styles.kindHead}>
              {mealLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.headcount}>
              <th scope="row" className={styles.people}>
                {`${row.headcount}人`}
              </th>
              <td className={styles.total}>{`${row.total}本`}</td>
              <td className={styles.kind}>{row.kanpai}</td>
              <td className={styles.kind}>{row.table}</td>
              <td className={styles.kind}>{row.meal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>{countTable.note}</p>
    </div>
  );
}
