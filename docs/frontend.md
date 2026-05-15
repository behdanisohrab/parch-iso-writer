# Frontend Architecture and Components

The frontend is a React 19 + TypeScript SPA built with Vite on port 1420.

## State Management (`src/store.ts`)

Uses Zustand for lightweight global state. The store tracks step position, source mode, selected release/drive, operation stage, all progress values, and language:

```ts
export const useStore = create<AppState>((set) => ({
  ...initial,
  setStep: (step) => set({ step }),
  setSelectedRelease: (selectedRelease) => set({ selectedRelease }),
  setStage: (stage) => set({ stage }),
  setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
  setFlashProgress: (flashProgress) => set({ flashProgress }),
  setError: (error) => set({ error }),
  reset: () => set(initial),
}));
```

## WriteStep (`src/steps/WriteStep.tsx`)

Orchestrates the full pipeline. The `start` callback is a sequential async flow:

```tsx
const start = useCallback(async () => {
  cancelRef.current = false;

  try {
    if (sourceMode === 'download' && selectedRelease) {
      setStage('downloading');
      await invoke('download_release', { url: selectedRelease.url, destPath });

      if (selectedRelease.checksum_url) {
        setStage('verifying');
        const expected = await invoke<string>('fetch_checksum', { ... });
        const ok = await invoke<boolean>('verify_checksum', { ... });
        if (!ok) { setStage('error'); return; }
      }

      if (selectedRelease.kind === 'ImgTarXz') {
        setStage('extracting');
        sourcePath = await invoke<string>('extract_img_from_tar_xz', { ... });
      }
    }

    setStage('flashing');
    await invoke('flash_image', { sourcePath, devicePath: selectedDrive?.path });
    if (!cancelRef.current) setStage('done');
  } catch (err) {
    if (!cancelRef.current) {
      setStage('error');
      setError(typeof err === 'string' ? err : (err as Error).message);
    }
  }
}, [...]);
```

Progress events are registered via Tauri's `listen` API on mount:

```tsx
useEffect(() => {
  const unlisten1 = listen<ProgressInfo>('download_progress', (e) => {
    setDownloadProgress(e.payload);
  });
  const unlisten2 = listen<{ percent: number }>('extract_progress', (e) => {
    setExtractProgress(e.payload.percent);
  });
  const unlisten3 = listen<FlashProgressInfo>('flash_progress', (e) => {
    setFlashProgress(e.payload);
  });
  return () => {
    unlisten1.then((f) => f());
    unlisten2.then((f) => f());
    unlisten3.then((f) => f());
  };
}, []);
```

## Circular Progress Ring

Rendered as an inline SVG in the active state:

```tsx
{isActive && (
  <div className="card logo-progress-card">
    <div className="logo-progress-ring-wrap">
      <svg width={104} height={104} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={326.73}
          strokeDashoffset={326.73 * (1 - overallProgress / 100)}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="logo-progress-pct">{overallProgress.toFixed(0)}%</div>
    </div>
    <div className="logo-progress-label">{progressLabel}</div>
    {progressSublabel && <div className="logo-progress-sublabel">{progressSublabel}</div>}
  </div>
)}
```

Overall progress is computed from the current stage:

```ts
function getOverallProgress(stage, downloadProgress, extractProgress, flashProgress): number {
  switch (stage) {
    case 'downloading': return (downloadProgress.downloaded_bytes / downloadProgress.total_bytes) * 100;
    case 'verifying': return 100;
    case 'extracting': return extractProgress ?? 0;
    case 'flashing': return (flashProgress.written_bytes / flashProgress.total_bytes) * 100;
    case 'done': return 100;
    default: return 0;
  }
}
```

## Cancel Handler

On cancel, sets a ref (to prevent stale state updates) and invokes both cancel commands concurrently:

```tsx
const handleCancel = async () => {
  cancelRef.current = true;
  await Promise.all([
    invoke('cancel_download').catch(() => {}),
    invoke('cancel_flash').catch(() => {}),
  ]);
  setStage('idle');
};
```

## Languages

`src/i18n.ts` contains all UI strings in English and Persian. Persian mode adds the `lang-fa` class to the app root, enabling RTL layout with a Persian-friendly font.

## Styling (`src/styles/globals.css`)

All styles use CSS custom properties on a dark theme with teal accents. Layout uses flexbox. Cards have gradient backgrounds. Buttons have primary, secondary, and ghost variants. The progress ring uses `stroke-dashoffset` transitions.
