const AXES = [
  { no: "01", name: "場", body: "次のオフィスの午後。" },
  { no: "02", name: "見た目", body: "卓に馴染むか。" },
  { no: "03", name: "サイズ", body: "一人が飲み切る。" },
  { no: "04", name: "味", body: "果実、炭酸、苦み。" },
] as const;

export function AxisList() {
  return (
    <ol className="axes" data-stagger>
      {AXES.map((axis) => (
        <li key={axis.no} className="axis" data-stagger-item>
          <span className="numeral" aria-hidden="true">
            {axis.no}
          </span>
          <div>
            <p className="axis__name">{axis.name}</p>
            <p className="axis__body">{axis.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
