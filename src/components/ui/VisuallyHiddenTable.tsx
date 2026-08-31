/**
 * The accessible fallback for a chart.
 *
 * A Recharts SVG has no text content a screen reader can use — its "text" is
 * drawn as vector paths — so a chart that only renders the SVG is invisible to
 * assistive tech beyond whatever `aria-label` its container carries. This adds
 * the underlying series as a real, semantic `<table>`, visually hidden but
 * fully readable by AT, so anyone who wants more than the one-sentence summary
 * on the chart's `role="img"` wrapper can get the actual numbers.
 */
interface VisuallyHiddenTableProps {
  caption: string
  headers: string[]
  rows: (string | number)[][]
}

export function VisuallyHiddenTable({ caption, headers, rows }: VisuallyHiddenTableProps) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
