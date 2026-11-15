import { useEffect, useId, useRef, useState } from 'react'
import { toDataURL } from '../vendor/qr-code.js'
import { checkedShareUrl, currentAppUrl, isLoopback } from '../services/shareUrl.js'
import './ShareQr.css'

function QrIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h-3zM18 18h3v3h-3zM12 3v3M12 9v3H9M3 12h3M12 15v6M21 12h-6"/></svg>
}
export default function ShareQr() {
  const dialog = useRef(null), opener = useRef(null)
  const titleId = useId()
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(''), [url, setUrl] = useState('')
  const [qr, setQr] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [networks, setNetworks] = useState([]), [discovering, setDiscovering] = useState(false)
  const [feedback, setFeedback] = useState('')
  const applyUrl = value => {
    setDraft(value); setFeedback('')
    try { setUrl(checkedShareUrl(value)); setError('') }
    catch (e) { setUrl(''); setError(e.message) }
  }

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setQr(''); setError(''); setFeedback(''); setNotice(''); setNetworks([]); setDiscovering(false)
    const configured = import.meta.env.VITE_PUBLIC_APP_URL
    if (configured) { applyUrl(configured); return () => controller.abort() }
    if (!isLoopback(location.hostname)) {
      applyUrl(currentAppUrl(location.origin, import.meta.env.BASE_URL))
      return () => controller.abort()
    }
    setDraft(''); setUrl(''); setDiscovering(true)
    fetch('/__auralis/share-info', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('missing-sharing-info')
        return response.json()
      })
      .then(info => {
        if (controller.signal.aborted) return
        if (!info.lanEnabled) {
          setNotice('Vite đang chỉ mở trên máy này. Dừng Vite bằng Ctrl+C và chạy lại lệnh bên dưới để điện thoại truy cập được.')
          if (info.urls?.[0]) setDraft(info.urls[0].url)
          return
        }
        const valid = (info.urls || []).filter(item => { try { checkedShareUrl(item.url); return true } catch { return false } })
        setNetworks(valid)
        if (valid.length) applyUrl(valid[0].url)
        else setNotice('Chưa tìm thấy địa chỉ Wi-Fi phù hợp. Hãy nhập link Network do Vite hiển thị.')
      })
      .catch(() => {
        if (!controller.signal.aborted) setNotice('Chưa tự nhận được địa chỉ Network. Hãy chạy Vite với --host 0.0.0.0 và nhập link Network bên dưới.')
      })
      .finally(() => { if (!controller.signal.aborted) setDiscovering(false) })
    return () => controller.abort()
  }, [open])

  useEffect(() => {
    if (!open || !url) { setQr(''); return }
    let active = true
    setQr('')
    toDataURL(url, { errorCorrectionLevel: 'M', margin: 4, width: 640, color: { dark: '#123c3d', light: '#ffffff' } })
      .then(data => { if (active) setQr(data) })
      .catch(() => { if (active) setError('Không tạo được QR cho địa chỉ này. Hãy thử lại.') })
    return () => { active = false }
  }, [url, open])

  const close = () => { dialog.current?.close(); setOpen(false); opener.current?.focus() }
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url)
      else {
        const field = document.createElement('textarea'); field.value = url
        field.style.position = 'fixed'; field.style.opacity = '0'; dialog.current.appendChild(field)
        field.select(); const copied = document.execCommand('copy'); field.remove()
        if (!copied) throw new Error('copy-failed')
      }
      setFeedback('Đã sao chép link ứng dụng.')
    } catch { setFeedback('Không sao chép tự động được. Có thể chọn và sao chép địa chỉ bên dưới QR.') }
  }
  return <>
    <button ref={opener} className="btn" type="button" onClick={() => { setOpen(true); dialog.current.showModal() }}><QrIcon/><span>Mã QR</span></button>
    <dialog ref={dialog} className="share-qr-dialog" aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <section className="share-qr-content">
        <header className="share-qr-heading"><span className="share-qr-badge"><QrIcon/> CHIA SẺ AURALIS</span><button type="button" aria-label="Đóng mã QR" onClick={close}>×</button></header>
        <h2 id={titleId}>Quét mã, bắt đầu khám phá.</h2>
        <p className="share-qr-intro">Mở ứng dụng trên điện thoại bằng camera hoặc trình quét QR.</p>
        <div className="share-qr-image">{qr ? <img src={qr} alt="Mã QR mở ứng dụng AURALIS" width="240" height="240"/> : <div className="share-qr-placeholder"><QrIcon/><span>{discovering ? 'Đang tìm địa chỉ mạng…' : url ? 'Đang tạo mã QR…' : 'Nhập link truy cập được từ điện thoại'}</span></div>}</div>
        {qr && <><a className="share-qr-current" href={url} title={url}>{url}</a><div className="share-qr-actions"><button type="button" className="btn" onClick={copy}>Sao chép link</button><a className="btn share-qr-download" href={qr} download="AURALIS_QR.png">Tải ảnh QR</a></div></>}
        <p className="share-qr-feedback" role="status">{feedback}</p>
        <div className="share-qr-network-note"><b>Nếu đang chạy trên máy tính</b><span>Điện thoại cần cùng Wi-Fi; giữ Vite và backend đang chạy. Người ở khác mạng cần link ứng dụng đã triển khai trên Internet.</span></div>
        {notice && <div className="share-qr-notice" role="status">{notice}<code>npm run dev -- --host 0.0.0.0 --port {location.port || '5180'} --strictPort</code></div>}
        {networks.length > 1 && <label className="share-qr-label">Chọn mạng để chia sẻ<select aria-label="Chọn địa chỉ mạng" value={networks.some(item => item.url === draft) ? draft : ''} onChange={e => applyUrl(e.target.value)}><option value="" disabled>Chọn địa chỉ</option>{networks.map(item => <option key={item.url} value={item.url}>{item.label}</option>)}</select></label>}
        <form className="share-qr-form" onSubmit={e => { e.preventDefault(); applyUrl(draft) }}><label className="share-qr-label" htmlFor={titleId + '-url'}>Địa chỉ mở ứng dụng</label><div><input id={titleId + '-url'} type="url" required placeholder="http://192.168.1.10:5180/" autoComplete="off" value={draft} onChange={e => { setDraft(e.target.value); setError('') }}/><button className="btn" type="submit">Tạo QR</button></div></form>
        {error && <p className="share-qr-error" role="alert">{error}</p>}
      </section>
    </dialog>
  </>
}
