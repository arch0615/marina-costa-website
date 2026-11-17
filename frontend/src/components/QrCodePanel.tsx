import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { downloadText, downloadUrl } from '@/utils/download'
import { createQrPngDataUrl, createQrSvg, svgToDataUrl } from '@/utils/qr'
import { Skeleton } from './StatusViews'

interface QrCodePanelProps {
  /** Permanent URL encoded in the QR code. */
  url: string
  /** Base for downloaded file names, e.g. "marina-costa-card". */
  fileBaseName: string
}

type QrState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; svg: string }

export function QrCodePanel({ url, fileBaseName }: QrCodePanelProps) {
  const [state, setState] = useState<QrState>({ status: 'loading' })
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let active = true
    createQrSvg(url).then(
      (svg) => active && setState({ status: 'ready', svg }),
      () => active && setState({ status: 'error' }),
    )
    return () => {
      active = false
    }
  }, [url])

  const downloadPng = async () => {
    setDownloading(true)
    try {
      downloadUrl(await createQrPngDataUrl(url), `${fileBaseName}-qr.png`)
    } catch {
      toast.error('The QR code could not be downloaded. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const downloadSvg = () => {
    if (state.status === 'ready') downloadText(state.svg, `${fileBaseName}-qr.svg`, 'image/svg+xml')
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="rounded-2xl border border-border bg-white p-3 shadow-soft">
        {state.status === 'ready' ? (
          <img
            src={svgToDataUrl(state.svg)}
            alt={`QR code that opens ${url}`}
            width={192}
            height={192}
            className="size-48"
            data-testid="qr-code"
          />
        ) : state.status === 'loading' ? (
          <Skeleton className="size-48" />
        ) : (
          <p
            role="alert"
            className="flex size-48 items-center justify-center text-center text-sm text-muted-foreground"
          >
            QR code unavailable
          </p>
        )}
      </div>
      <p className="max-w-[16rem] text-center text-sm text-muted-foreground">
        Scan to open this card. The code always points to{' '}
        <span className="font-medium break-all text-foreground">
          {url.replace(/^https?:\/\//, '')}
        </span>
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadPng}
          disabled={state.status !== 'ready' || downloading}
        >
          <Download aria-hidden="true" />
          Download PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadSvg}
          disabled={state.status !== 'ready'}
        >
          <Download aria-hidden="true" />
          Download SVG
        </Button>
      </div>
    </div>
  )
}
