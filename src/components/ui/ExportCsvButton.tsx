import { useT } from '../../i18n/i18n'
import { Button } from './Controls'

interface ExportCsvButtonProps {
  /** Built lazily so the CSV always reflects the parameters at click time. */
  build: () => string
  filename: string
}

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
    <path fill="currentColor" d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
  </svg>
)

export function ExportCsvButton({ build, filename }: ExportCsvButtonProps) {
  const t = useT()

  const download = () => {
    // The BOM keeps Excel from mangling the accented headers.
    const blob = new Blob(['\ufeff' + build()], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="filled" onClick={download} icon={<DownloadIcon />}>
      {t.common.exportCsv}
    </Button>
  )
}
