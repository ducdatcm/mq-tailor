import { useEffect, useState } from 'react';
import { flushQueue, queuedCount } from '../sheet/client';
import { loadSheetConfig, readLocalSheetConfig, saveLocalSheetConfig } from '../sheet/config';

/**
 * Staff-only page for this tablet (open with #/setup, or tap the logo five times): where orders are
 * sent, a connection test, and facts about the screen. It is not part of the customer flow, so it
 * is in Vietnamese only.
 */

interface Notice {
  kind: 'ok' | 'bad' | 'info';
  text: string;
}

function readDeviceInfo() {
  const mq = (q: string) => window.matchMedia(q).matches;
  return {
    css: `${window.innerWidth} × ${window.innerHeight} px (CSS)`,
    pixels: `${Math.round(window.innerWidth * window.devicePixelRatio)} × ${Math.round(window.innerHeight * window.devicePixelRatio)} điểm ảnh, tỉ lệ ${window.devicePixelRatio}`,
    orientation: window.innerWidth >= window.innerHeight ? 'Nằm ngang' : 'Nằm dọc',
    mode: mq('(display-mode: fullscreen)') ? 'Toàn màn hình (đã cài)' : mq('(display-mode: standalone)') ? 'Ứng dụng độc lập (đã cài)' : 'Trong trình duyệt',
    offline: 'serviceWorker' in navigator ? (navigator.serviceWorker.controller ? 'Đã bật, chạy được khi mất mạng' : 'Chưa bật (tải lại trang một lần sau khi có mạng)') : 'Trình duyệt không hỗ trợ',
    wake: 'wakeLock' in navigator ? 'Giữ sáng màn hình: có' : 'Giữ sáng màn hình: không hỗ trợ',
    network: navigator.onLine ? 'Đang có mạng' : 'Không có mạng',
    build: __BUILD__,
  };
}

export function SetupScreen() {
  const saved = readLocalSheetConfig();
  const [url, setUrl] = useState(saved?.orderSheetUrl ?? '');
  const [token, setToken] = useState(saved?.orderSheetToken ?? '');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [queued, setQueued] = useState(queuedCount());
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [info, setInfo] = useState(readDeviceInfo);

  useEffect(() => {
    document.title = 'Cài đặt máy — Minh Quang';
    const refresh = () => setInfo(readDeviceInfo());
    window.addEventListener('resize', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    // the address that applies when nothing is typed here (config.json on the host)
    void loadSheetConfig().then((c) => setFileUrl(readLocalSheetConfig() ? null : c.orderSheetUrl || ''));
    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
    };
  }, []);

  const save = () => {
    saveLocalSheetConfig({ orderSheetUrl: url, orderSheetToken: token });
    setNotice(url.trim() ? { kind: 'ok', text: 'Đã lưu trên máy này. Các đơn từ bây giờ sẽ gửi vào bảng tính này.' } : { kind: 'info', text: 'Đã xóa cài đặt trên máy này.' });
  };

  const forget = () => {
    setUrl('');
    setToken('');
    saveLocalSheetConfig(null);
    setNotice({ kind: 'info', text: 'Đã xóa cài đặt trên máy này.' });
  };

  const test = async () => {
    const address = url.trim();
    if (!address) {
      setNotice({ kind: 'bad', text: 'Chưa nhập địa chỉ.' });
      return;
    }
    setBusy(true);
    setNotice({ kind: 'info', text: 'Đang kiểm tra...' });
    const ctl = new AbortController();
    const timer = window.setTimeout(() => ctl.abort(), 12000);
    try {
      const res = await fetch(address, { signal: ctl.signal, redirect: 'follow' });
      const text = (await res.text()).trim();
      setNotice(
        res.ok && /^OK\b/.test(text)
          ? { kind: 'ok', text: 'Kết nối được: bảng tính trả lời "' + text + '". Nhớ bấm Lưu.' }
          : { kind: 'bad', text: 'Địa chỉ có trả lời nhưng không đúng như mong đợi. Kiểm tra lại địa chỉ ứng dụng web (kết thúc bằng /exec).' },
      );
    } catch {
      setNotice({ kind: 'bad', text: 'Không kết nối được. Kiểm tra mạng, địa chỉ, và mục "Người có quyền truy cập" của Apps Script phải là "Bất kỳ ai".' });
    } finally {
      window.clearTimeout(timer);
      setBusy(false);
    }
  };

  const sendQueue = async () => {
    setBusy(true);
    const sent = await flushQueue();
    setQueued(queuedCount());
    setNotice(sent > 0 ? { kind: 'ok', text: `Đã gửi ${sent} đơn đang chờ.` } : { kind: 'info', text: queuedCount() === 0 ? 'Không có đơn nào đang chờ.' : 'Chưa gửi được. Kiểm tra mạng và địa chỉ bảng tính.' });
    setBusy(false);
  };

  return (
    <main className="setup">
      <h1>Cài đặt máy này</h1>
      <p className="lead">Trang dành cho nhân viên, khách không thấy. Cài một lần cho mỗi tablet.</p>

      <section className="setup-section">
        <h2>Bảng tính Google (nhận đơn hàng)</h2>
        <div className="field">
          <label htmlFor="setup-url" className="field-label">
            Địa chỉ ứng dụng web (Apps Script)
          </label>
          <input
            id="setup-url"
            className="field-input"
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="https://script.google.com/macros/s/.../exec"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="setup-token" className="field-label">
            Mã bí mật (SECRET), nếu có đặt
          </label>
          <input
            id="setup-token"
            className="field-input"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        {fileUrl ? <p className="field-hint">Máy chưa có cài đặt riêng; đang dùng địa chỉ mặc định của trang web.</p> : null}
        <div className="setup-actions">
          <button type="button" className="btn btn-secondary" onClick={test} disabled={busy}>
            Kiểm tra kết nối
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>
            Lưu
          </button>
          <button type="button" className="btn btn-quiet" onClick={forget} disabled={busy}>
            Xóa cài đặt
          </button>
        </div>
        {notice ? (
          <p className={`setup-notice is-${notice.kind}`} role="status">
            {notice.text}
          </p>
        ) : null}
      </section>

      <section className="setup-section">
        <h2>Đơn đang chờ gửi</h2>
        <p>
          {queued === 0 ? 'Không có đơn nào đang chờ.' : `${queued} đơn đang chờ gửi (mất mạng hoặc chưa kết nối bảng tính). Các đơn này tự gửi khi có mạng.`}
        </p>
        {queued > 0 ? (
          <div className="setup-actions">
            <button type="button" className="btn btn-secondary" onClick={sendQueue} disabled={busy}>
              Gửi ngay
            </button>
          </div>
        ) : null}
      </section>

      <section className="setup-section">
        <h2>Thông tin máy</h2>
        <dl className="setup-info">
          <dt>Kích thước màn hình</dt>
          <dd>{info.css}</dd>
          <dt>Điểm ảnh thật</dt>
          <dd>{info.pixels}</dd>
          <dt>Hướng</dt>
          <dd>{info.orientation}</dd>
          <dt>Cách chạy</dt>
          <dd>{info.mode}</dd>
          <dt>Dùng khi mất mạng</dt>
          <dd>{info.offline}</dd>
          <dt>Màn hình</dt>
          <dd>{info.wake}</dd>
          <dt>Mạng</dt>
          <dd>{info.network}</dd>
          <dt>Phiên bản</dt>
          <dd>{info.build}</dd>
        </dl>
      </section>

      <p>
        <a className="btn btn-primary btn-large" href="#/">
          Về ứng dụng
        </a>
      </p>
    </main>
  );
}
