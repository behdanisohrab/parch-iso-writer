export type ReleaseKind = 'Iso' | 'ImgTarXz';
export type ChecksumKind = 'Md5' | 'Sha256' | 'None';

export interface Release {
  id: string;
  name: string;
  edition: string;
  arch: string;
  kind: ReleaseKind;
  url: string;
  checksum_url: string | null;
  checksum_kind: ChecksumKind;
  description: string;
  description_fa: string;
}

export interface UsbDrive {
  path: string;
  name: string;
  size_bytes: number;
  is_removable: boolean;
  vendor: string;
  model: string;
}

export interface ImageInfo {
  is_valid: boolean;
  kind: string;
  label: string;
  size_bytes: number;
}

export interface ProgressInfo {
  downloaded_bytes: number;
  total_bytes: number;
  speed_bps: number;
  eta_secs?: number;
}

export interface FlashProgressInfo {
  written_bytes: number;
  total_bytes: number;
  speed_bps: number;
}

export type VerifyMode = 'none' | 'first_block' | 'sampled' | 'full';

export type AppStep = 1 | 2 | 3;
export type SourceMode = 'download' | 'local';
export type OperationStage =
  | 'idle'
  | 'downloading'
  | 'verifying'
  | 'extracting'
  | 'flashing'
  | 'done'
  | 'error';

export const ARCH_LABELS: Record<string, string> = {
  'x86_64': 'x86_64',
  'aarch64': 'aarch64',
  'rpi-aarch64': 'Raspberry Pi',
};

export const ARCH_LABELS_SHORT: Record<string, string> = {
  'x86_64': 'x86',
  'aarch64': 'ARM',
  'rpi-aarch64': 'RPi',
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatSpeed(bps: number): string {
  if (bps === 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bps) / Math.log(1024));
  const val = bps / Math.pow(1024, i);
  return `${val.toFixed(1)} ${units[i]}`;
}

export function formatEta(secs: number): string {
  if (secs <= 0) return '';
  if (secs < 60) return `${Math.ceil(secs)}s`;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}m ${s}s`;
}
