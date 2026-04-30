/**
 * useReports -- react-query hooks for ReportPage (#13)
 *
 * Hooks:
 *   useReportPreview(type, periodFrom, periodTo)  -- KPI 미리보기 6종
 *   useReportDownload()                            -- CSV/XLSX 다운로드 mutation
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/api/apiClient.ts';
import { downloadFile } from '@/utils/downloadFile.ts';
import type { ReportPreview, ReportType } from '@/types/index.ts';
import type { ExportFormat } from '@/utils/downloadFile.ts';

// ---------------------------------------------------------------------------
// Preview: KPI 6종 미리보기
// ---------------------------------------------------------------------------

interface PreviewParams {
  type: ReportType;
  periodFrom: string;   // "2026-04-01"
  periodTo: string;     // "2026-04-30"
}

export function useReportPreview(params: PreviewParams) {
  const { type, periodFrom, periodTo } = params;
  const enabled = !!type && !!periodFrom && !!periodTo;

  return useQuery<ReportPreview>({
    queryKey: ['reports', 'preview', type, periodFrom, periodTo],
    queryFn: async () => {
      const { data } = await apiClient.get<ReportPreview>('/reports/preview', {
        params: { type, periodFrom, periodTo },
      });
      return data;
    },
    enabled,
  });
}

// ---------------------------------------------------------------------------
// Download: CSV / XLSX mutation
// ---------------------------------------------------------------------------

interface DownloadParams {
  type: ReportType;
  periodFrom: string;
  periodTo: string;
  format: ExportFormat;
}

export function useReportDownload() {
  return useMutation<void, Error, DownloadParams>({
    mutationFn: async ({ type, periodFrom, periodTo, format }) => {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const ext = format === 'csv' ? 'csv' : 'xlsx';
      const filename = `AS_${type.toLowerCase()}_${periodFrom}_${periodTo}_${timestamp}.${ext}`;

      await downloadFile({
        url: `/reports/export/${format}`,
        params: { type, periodFrom, periodTo },
        filename,
        format,
      });
    },
  });
}
