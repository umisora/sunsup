type FillTextProps = {
  as?: "h2" | "p";
  id?: string;
  className?: string;
  lines: readonly string[];
};

export function FillText({ as: Tag = "p", id, className, lines }: FillTextProps) {
  return (
    <Tag id={id} className={className ? `fill ${className}` : "fill"} data-fill>
      <span className="sr-only">{lines.join("")}</span>
      <span aria-hidden="true">
        {lines.map((line) => (
          <span key={line} className="fill__line">
            {Array.from(line).map((char, index) => (
              <span key={index} className="fill__char">
                {char}
              </span>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  );
}
