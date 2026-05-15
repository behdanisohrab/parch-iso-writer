import { useRef, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useStore } from '../store';
import { t } from '../i18n';

export default function DropZone({
  onFileSelected,
}: {
  onFileSelected: (path: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const browseBusy = useRef(false);
  const { language } = useStore();

  const openFileDialog = async () => {
    if (browseBusy.current) return;
    browseBusy.current = true;
    try {
      const picked = await open({
        title: t(language, 'selectDiskImage'),
        multiple: false,
        filters: [
          {
            name: 'Disk images',
            extensions: ['iso', 'img', 'xz'],
          },
        ],
      });
      if (typeof picked === 'string') {
        onFileSelected(picked);
      }
    } finally {
      browseBusy.current = false;
    }
  };

  return (
    <div
      className={`card drop-zone ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        const droppedPath = (file as File & { path?: string }).path;
        if (droppedPath) onFileSelected(droppedPath);
      }}
      onClick={openFileDialog}
    >
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <div className="drop-zone-title">{t(language, 'dropTitle')}</div>
      <div className="drop-zone-subtitle">
        {t(language, 'dropSubtitle')}
      </div>
      <div className="drop-zone-badges">
        <span className="badge">.iso</span>
        <span className="badge">.img</span>
        <span className="badge badge-accent">.tar.xz</span>
      </div>
    </div>
  );
}
