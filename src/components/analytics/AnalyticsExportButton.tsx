import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { toast } from 'sonner';

interface ExportColumn {
  header: string;
  accessor: string;
  format?: (val: any) => string;
}

interface AnalyticsExportButtonProps {
  title: string;
  data: Record<string, any>[];
  columns: ExportColumn[];
  filename: string;
}

export const AnalyticsExportButton = ({ title, data, columns, filename }: AnalyticsExportButtonProps) => {
  const [exporting, setExporting] = useState(false);

  const handleCSV = () => {
    try {
      const rows = data.map(row => {
        const mapped: Record<string, any> = {};
        columns.forEach(col => {
          const key = col.header.toLowerCase().replace(/\s+/g, '_');
          mapped[key] = col.format ? col.format(row[col.accessor]) : (row[col.accessor] ?? '');
        });
        return mapped;
      });
      exportToCSV(rows, filename, columns.map(c => c.header));
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  const handlePDF = async () => {
    setExporting(true);
    try {
      await exportToPDF(title, data, columns, filename);
      toast.success('PDF report opened in new tab');
    } catch (e: any) {
      toast.error(e.message || 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" disabled={exporting || data.length === 0}>
          <Download className="h-3 w-3" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCSV}>Download CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF}>Download PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
