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
      role="button"
      tabIndex={0}
      className={`mac-dropzone ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        const droppedPath = (file as File & { path?: string }).path;
        if (droppedPath) onFileSelected(droppedPath);
      }}
      onClick={openFileDialog}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openFileDialog();
        }
      }}
      aria-label={t(language, 'dropTitle')}
    >
      <div className="mac-dropzone-icon">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="mac-dropzone-title">{t(language, 'dropTitle')}</div>
      <div className="mac-dropzone-subtitle">{t(language, 'dropSubtitle')}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <span className="mac-badge mac-badge-accent">.ISO</span>
        <span className="mac-badge mac-badge-blue">.IMG</span>
        <span className="mac-badge mac-badge-neutral">.TAR.XZ</span>
      </div>
    </div>
  );
}
