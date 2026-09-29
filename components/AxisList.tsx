import { Photo } from "@/components/Photo";

const AXES = [
  { no: "01", name: "場", body: "次のオフィスの午後。", photo: "place", position: "46% 50%" },
  { no: "02", name: "見た目", body: "卓に馴染むか。", photo: "peak", position: "38% 50%" },
  { no: "03", name: "サイズ", body: "一人が飲み切る。", photo: "office", position: "80% 50%" },
  { no: "04", name: "味", body: "果実、炭酸、苦み。", photo: "detail", position: "28% 62%" },
] as const;

export function AxisList() {
  return (
    <ol className="bento">
      {AXES.map((axis) => (
        <li key={axis.no} className="bento__card" data-stagger-item>
          <div className="bento__media media">
            <Photo
              name={axis.photo}
              sizes="(min-width: 960px) 300px, 45vw"
              position={axis.position}
              decorative
            />
            <span className="bento__no" aria-hidden="true">
              {axis.no}
            </span>
          </div>
          <div className="bento__body">
            <p className="bento__name">{axis.name}</p>
            <p className="bento__text">{axis.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
