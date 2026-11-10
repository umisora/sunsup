import type { ReactNode } from "react";
import type { SceneCountTable } from "@/lib/scenes";
import { bottleCounts } from "@/lib/shopping-list";
import styles from "./BottleCountTable.module.css";

/** Headcounts the early table prints. Counts come from `bottleCounts`. */
const HEADCOUNTS = [5, 10, 20, 30] as const;

/**
 * Phrase boundaries for every scene's column labels.
 * Longer prefixes win, so ソフトドリンク stays whole and で stays with it when the column allows.
 */
const PHRASE_PREFIX = ["ソフトドリンク", "乾杯する", "乾杯の", "小さな", "大きな", "で"] as const;

function withBreaks(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length > 0) {
    const hit = PHRASE_PREFIX.filter((word) => rest.startsWith(word)).sort((a, b) => b.length - a.length)[0];
    if (!hit) {
      nodes.push(rest);
      break;
    }
    nodes.push(hit);
    rest = rest.slice(hit.length);
    if (rest.length > 0) {
      nodes.push(<wbr key={key} />);
      key += 1;
    }
  }
  return nodes;
}

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
              {withBreaks(countTable.headcountLabel)}
            </th>
            <th scope="col" className={styles.totalHead}>
              合計
            </th>
            <th scope="col" className={styles.kindHead}>
              {withBreaks(toastLabel)}
            </th>
            <th scope="col" className={styles.kindHead}>
              {withBreaks(bigLabel)}
            </th>
            <th scope="col" className={styles.kindHead}>
              {withBreaks(mealLabel)}
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
