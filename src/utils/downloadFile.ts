/**
 * downloadFile -- blob-based file download utility
 *
 * Supports CSV (with UTF-8 BOM for Korean Excel compatibility) and XLSX.
 * No external library needed -- uses native <a> + URL.createObjectURL.
 */

import apiClient from '@/api/apiClient.ts';

export type ExportFormat = 'csv' | 'xlsx';

interface DownloadOptions {
  /** API endpoint path (e.g. "/reports/export/csv") */
  url: string;
  /** Query params to append */
  params?: Record<string, string>;
  /** Suggested filename (e.g. "AS_monthly_2026-04.csv") */
  filename: string;
  /** File format -- determines Content-Type handling */
  format: ExportFormat;
}

/**
 * Download a file from the API as a blob.
 *
 * For CSV: the server should return UTF-8 with BOM (\uFEFF prefix)
 * so Excel displays Korean correctly. If the server omits BOM,
 * this function prepends it client-side.
 */
export async function downloadFile(options: DownloadOptions): Promise<void> {
  const { url, params, filename, format } = options;

  const response = await apiClient.get<Blob>(url, {
    params,
    responseType: 'blob',
  });

  let blob = response.data;

  // CSV: ensure UTF-8 BOM for Korean Excel compatibility
  if (format === 'csv') {
    const text = await blob.text();
    const hasBom = text.charCodeAt(0) === 0xFEFF;
    if (!hasBom) {
      blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' });
    }
  }

  // Trigger browser download via hidden <a>
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}
