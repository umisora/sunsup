import { bottleCounts } from "@/lib/shopping-list";
import styles from "./BottleCountTable.module.css";

/** People the bonenkai early table prints. Counts come from `bottleCounts`. */
const HEADCOUNTS = [5, 10, 20, 30] as const;

export const BOTTLE_COUNT_CAPTION_ID = "bonenkai-bottle-counts";

/**
 * Static headcount table for the bonenkai page, above the recommended list.
 * Cells are the calculator's bottles, not a second set of numbers.
 */
export function BottleCountTable() {
  const rows = HEADCOUNTS.map((people) => bottleCounts(people));
  return (
    <div className={styles.block}>
      <table className={styles.table}>
        <caption id={BOTTLE_COUNT_CAPTION_ID} className={styles.caption}>
          何人で何本？ ノンアルの本数早見表
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
              ソフトドリンクで乾杯する人
            </th>
            <th scope="col" className={styles.totalHead}>
              合計
            </th>
            <th scope="col" className={styles.kindHead}>
              小さな瓶
            </th>
            <th scope="col" className={styles.kindHead}>
              大きな瓶
            </th>
            <th scope="col" className={styles.kindHead}>
              甘さ控えめ
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
      <p className={styles.note}>
        小さな瓶はひとり1本、大きな瓶は4人に1本、甘さ控えめは2人に1本（端数は切り上げ）。水やお茶は数に入れていない、STYLISH!の目安です。
      </p>
    </div>
  );
}
