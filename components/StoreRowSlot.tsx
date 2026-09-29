const ROWS = [
  { role: "acquire", label: "手に入れる" },
  { role: "nearby", label: "近く" },
  { role: "read", label: "読む" },
] as const;

export function StoreRowSlot() {
  return (
    <section id="store-row" className="store-row" hidden aria-label="手に入れる">
      <dl>
        {ROWS.map((row) => (
          <div key={row.role} className="store-row__line" data-role={row.role}>
            <dt>{row.label}</dt>
            <dd />
          </div>
        ))}
      </dl>
    </section>
  );
}
