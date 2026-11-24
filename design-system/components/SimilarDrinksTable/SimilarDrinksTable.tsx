import type { SimilarDrinkRow } from "@/lib/similar-drinks";
import { COLUMN_DIFFERENCE, COLUMN_NAME, COLUMN_SERVINGS, COLUMN_VOLUME } from "@/lib/similar-drinks";
import { SoftBreak, TextLink } from "../Text/Text";
import styles from "./SimilarDrinksTable.module.css";

type SimilarDrinksTableProps = {
  rows: readonly SimilarDrinkRow[];
};

/** Comparison table of two or three nearby drinks. Cells are facts; the name links to that drink page. */
export function SimilarDrinksTable({ rows }: SimilarDrinksTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className={styles.block}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.nameHead}>
              {COLUMN_NAME}
            </th>
            <th scope="col" className={styles.numHead}>
              {COLUMN_VOLUME}
            </th>
            <th scope="col" className={styles.numHead}>
              {COLUMN_SERVINGS}
            </th>
            <th scope="col" className={styles.diffHead}>
              {COLUMN_DIFFERENCE}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.drink.slug}>
              <th scope="row" className={styles.nameCell}>
                <TextLink href={`/drink/${row.drink.slug}/`}>
                  <SoftBreak text={row.drink.name} />
                </TextLink>
              </th>
              <td className={styles.numCell}>{row.volume}</td>
              <td className={styles.numCell}>{row.servings}</td>
              <td className={styles.diffCell}>{row.difference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
