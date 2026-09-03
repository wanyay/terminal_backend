import { Workbook, Worksheet, Cell } from 'exceljs';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export class ExcelExportHelper {
  static async createWorkbook(): Promise<Workbook> {
    const workbook = new Workbook();
    workbook.creator = 'Terminal Port Management System';
    workbook.created = new Date();
    return workbook;
  }

  static addWorksheet(workbook: Workbook, name: string): Worksheet {
    return workbook.addWorksheet(name);
  }

  static setColumns(worksheet: Worksheet, columns: ExcelColumn[]): void {
    worksheet.columns = columns;
  }

  static addRow(worksheet: Worksheet, data: any): void {
    worksheet.addRow(data);
  }

  static addRows(worksheet: Worksheet, data: any[]): void {
    worksheet.addRows(data);
  }

  static styleHeaderRow(worksheet: Worksheet): void {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  static autoFitColumns(worksheet: Worksheet): void {
    worksheet.columns.forEach((column) => {
      if (column && column.header) {
        let maxLength = column.header.length;
        const colIndex = worksheet.columns.indexOf(column);
        worksheet.eachRow({ includeEmpty: true }, (row) => {
          const cell = row.getCell(colIndex + 1);
          const value = cell.value ? cell.value.toString() : '';
          if (value.length > maxLength) {
            maxLength = value.length;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      }
    });
  }

  static async generateBuffer(workbook: Workbook): Promise<Buffer> {
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
