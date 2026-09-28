type StoreRole = "acquire" | "nearby" | "read";

type StorePlaceholder = {
  role: StoreRole;
  label: string;
  shops: readonly string[];
};

const PLACEHOLDERS: readonly StorePlaceholder[] = [
  { role: "acquire", label: "手に入れる", shops: ["Amazon", "楽天"] },
  { role: "nearby", label: "近く", shops: ["カクヤス"] },
  { role: "read", label: "読む", shops: ["ヨドバシ"] },
];

export function StoreRowSlot() {
  return <div id="store-row" hidden data-slot="store-row" data-rows={PLACEHOLDERS.length} />;
}
