import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileImage, X } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { fmtBytes } from '../lib/format.js';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export function FileDropzone({ file, onFile, maxMb = 15 }) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handle = useCallback(
    (f) => {
      setError('');
      if (!f) return;
      if (!ACCEPT.includes(f.type)) return setError('Use a JPG, PNG, WEBP or PDF file.');
      if (f.size > maxMb * 1024 * 1024) return setError(`File must be under ${maxMb} MB.`);
      onFile(f);
    },
    [onFile, maxMb]
  );

  const preview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  if (file) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border bg-white p-4 dark:bg-slate-900">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          {preview ? (
            <img src={preview} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <FileImage className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{file.name}</p>
          <p className="text-xs text-slate-400">{fmtBytes(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onFile(null)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition',
          drag
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
            : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900'
        )}
      >
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          Drop your X-ray here, or <span className="text-brand-600 dark:text-brand-400">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">JPG, PNG, WEBP or PDF · up to {maxMb} MB</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
