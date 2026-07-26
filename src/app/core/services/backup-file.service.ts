import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { StilloraBackup } from '../models/app.models';

const MAX_BACKUP_BYTES = 64 * 1024;

interface StilloraNativeBridge {
  exportBackupJson(json: string, fileName: string): void;
}

interface NativeWindow extends Window {
  StilloraNative?: StilloraNativeBridge;
}

@Injectable({ providedIn: 'root' })
export class BackupFileService {
  private readonly document = inject(DOCUMENT);

  export(backup: StilloraBackup): 'native' | 'web' {
    const view = this.document.defaultView as NativeWindow | null;
    if (!view) throw new Error('File export is unavailable in this environment.');

    const json = `${JSON.stringify(backup, null, 2)}\n`;
    const fileName = `stillora-backup-${backup.exportedAt.slice(0, 10)}.json`;
    if (view.StilloraNative?.exportBackupJson) {
      view.StilloraNative.exportBackupJson(json, fileName);
      return 'native';
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.hidden = true;
    this.document.body.append(link);
    link.click();
    link.remove();
    view.setTimeout(() => URL.revokeObjectURL(url), 0);
    return 'web';
  }

  async import(file: File): Promise<unknown> {
    if (file.size > MAX_BACKUP_BYTES) throw new Error('This backup file is too large.');
    try {
      return JSON.parse(await file.text()) as unknown;
    } catch {
      throw new Error('This file does not contain valid JSON.');
    }
  }
}
