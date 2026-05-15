import { create } from 'zustand';
import type {
  AppStep,
  SourceMode,
  OperationStage,
  ProgressInfo,
  FlashProgressInfo,
  Release,
  UsbDrive,
} from './releases';

interface AppState {
  language: 'en' | 'fa';
  setLanguage: (lang: 'en' | 'fa') => void;

  step: AppStep;
  setStep: (step: AppStep) => void;

  sourceMode: SourceMode;
  setSourceMode: (mode: SourceMode) => void;

  selectedRelease: Release | null;
  setSelectedRelease: (r: Release | null) => void;

  localFilePath: string | null;
  setLocalFilePath: (p: string | null) => void;

  archFilter: string | null;
  setArchFilter: (arch: string | null) => void;

  drives: UsbDrive[];
  setDrives: (drives: UsbDrive[]) => void;

  selectedDrive: UsbDrive | null;
  setSelectedDrive: (d: UsbDrive | null) => void;

  stage: OperationStage;
  setStage: (s: OperationStage) => void;

  downloadProgress: ProgressInfo | null;
  setDownloadProgress: (p: ProgressInfo | null) => void;

  extractProgress: number | null;
  setExtractProgress: (p: number | null) => void;

  flashProgress: FlashProgressInfo | null;
  setFlashProgress: (p: FlashProgressInfo | null) => void;

  verificationOk: boolean | null;
  setVerificationOk: (ok: boolean | null) => void;

  error: string | null;
  setError: (err: string | null) => void;

  confirmChecked: boolean;
  setConfirmChecked: (c: boolean) => void;

  reset: () => void;
}

const initial = {
  language: 'en' as 'en' | 'fa',
  step: 1 as AppStep,
  sourceMode: 'download' as SourceMode,
  selectedRelease: null as Release | null,
  localFilePath: null as string | null,
  archFilter: null as string | null,
  drives: [] as UsbDrive[],
  selectedDrive: null as UsbDrive | null,
  stage: 'idle' as OperationStage,
  downloadProgress: null as ProgressInfo | null,
  extractProgress: null as number | null,
  flashProgress: null as FlashProgressInfo | null,
  verificationOk: null as boolean | null,
  error: null as string | null,
  confirmChecked: false,
};

export const useStore = create<AppState>((set) => ({
  ...initial,

  setLanguage: (language) => set({ language }),
  setStep: (step) => set({ step }),
  setSourceMode: (sourceMode) => set({ sourceMode }),
  setSelectedRelease: (selectedRelease) => set({ selectedRelease }),
  setLocalFilePath: (localFilePath) => set({ localFilePath }),
  setArchFilter: (archFilter) => set({ archFilter }),
  setDrives: (drives) => set({ drives }),
  setSelectedDrive: (selectedDrive) => set({ selectedDrive }),
  setStage: (stage) => set({ stage }),
  setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
  setExtractProgress: (extractProgress) => set({ extractProgress }),
  setFlashProgress: (flashProgress) => set({ flashProgress }),
  setVerificationOk: (verificationOk) => set({ verificationOk }),
  setError: (error) => set({ error }),
  setConfirmChecked: (confirmChecked) => set({ confirmChecked }),

  reset: () => set(initial),
}));
