import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCw, Download, Loader2 } from 'lucide-react';
import { fetchStudyBlob } from '../lib/api.js';
import { cn } from '../lib/cn.js';
import toast from 'react-hot-toast';

/**
 * Authorized study image/PDF viewer. Fetches the file as a blob (so the bearer
 * token applies), then supports zoom / pan / rotate for images.
 */
export function ImageViewer({ study, canDownload = true, className }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  const isPdf = study?.fileMime === 'application/pdf';

  useEffect(() => {
    let revoked;
    setLoading(true);
    setErr('');
    fetchStudyBlob(study.id)
      .then((blob) => {
        const u = URL.createObjectURL(blob);
        revoked = u;
        setUrl(u);
      })
      .catch(() => setErr('Could not load this file.'))
      .finally(() => setLoading(false));
    return () => revoked && URL.revokeObjectURL(revoked);
  }, [study.id]);

  const reset = () => {
    setZoom(1);
    setRot(0);
    setPos({ x: 0, y: 0 });
  };

  const download = async () => {
    try {
      const blob = await fetchStudyBlob(study.id, { download: true });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = study.fileName || 'study';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Download not permitted for this file.');
    }
  };

  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-slate-900', className)}>
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-3 py-2">
        <span className="truncate text-xs font-medium text-slate-300">{study.fileName}</span>
        <div className="flex items-center gap-1">
          {!isPdf && (
            <>
              <ViewerBtn onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} icon={ZoomOut} />
              <ViewerBtn onClick={() => setZoom((z) => Math.min(5, z + 0.25))} icon={ZoomIn} />
              <ViewerBtn onClick={() => setRot((r) => r + 90)} icon={RotateCw} />
              <ViewerBtn onClick={reset} icon={Maximize2} />
            </>
          )}
          {canDownload && <ViewerBtn onClick={download} icon={Download} />}
        </div>
      </div>

      <div
        className="relative flex h-[440px] items-center justify-center overflow-hidden"
        onMouseDown={(e) => (drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y })}
        onMouseMove={(e) => {
          if (!drag.current) return;
          setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
        }}
        onMouseUp={() => (drag.current = null)}
        onMouseLeave={() => (drag.current = null)}
        style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
      >
        {loading && <Loader2 className="h-6 w-6 animate-spin text-slate-500" />}
        {err && <p className="text-sm text-slate-400">{err}</p>}
        {!loading && !err && url && (
          isPdf ? (
            <iframe title={study.fileName} src={url} className="h-full w-full bg-white" />
          ) : (
            <img
              src={url}
              alt={study.title}
              draggable={false}
              className="max-h-full max-w-full select-none transition-transform"
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom}) rotate(${rot}deg)`,
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

function ViewerBtn({ onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
