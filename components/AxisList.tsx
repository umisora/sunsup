const AXES = [
  { name: "場", body: "次のオフィスの午後。" },
  { name: "見た目", body: "卓に馴染むか。" },
  { name: "サイズ", body: "一人が飲み切る。" },
  { name: "味", body: "果実、炭酸、苦み。" },
] as const;

export function AxisList() {
  return (
    <ul className="axes">
      {AXES.map((axis) => (
        <li key={axis.name} className="axis">
          <p className="axis__name">{axis.name}</p>
          <p className="axis__body">{axis.body}</p>
        </li>
      ))}
    </ul>
  );
}
