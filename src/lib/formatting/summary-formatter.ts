/**
 * Trip Summary Table Generation
 * Structured table formatting for trip summaries and key information
 */

import { ItineraryData } from './itinerary-formatter';

/**
 * Table configuration
 */
export const TABLE_CONFIG: any = {
  // Table styles
  STYLES: {
    simple: {
      top: '─',
      bottom: '─',
      left: '│',
      right: '│',
      cross: '┼',
      headerSeparator: '─',
      rowSeparator: '─',
    },
    rounded: {
      top: '─',
      bottom: '─',
      left: '│',
      right: '│',
      cross: '┼',
      headerSeparator: '─',
      rowSeparator: '─',
    },
    double: {
      top: '═',
      bottom: '═',
      left: '║',
      right: '║',
      cross: '╬',
      headerSeparator: '═',
      rowSeparator: '─',
    },
    markdown: {
      top: '|',
      bottom: '|',
      left: '|',
      right: '|',
      cross: '|',
      headerSeparator: '|',
      rowSeparator: '|',
    },
  },

  // Column alignment
  ALIGNMENT: {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
  } as const,

  // Default settings
  DEFAULT_STYLE: 'simple' as keyof typeof TABLE_CONFIG.STYLES,
  MIN_COLUMN_WIDTH: 8,
  MAX_COLUMN_WIDTH: 40,
  PADDING: 1,
} as const;

/**
 * Table column interface
 */
export interface TableColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}

/**
 * Table row interface
 */
export interface TableRow {
  [key: string]: any;
}

/**
 * Table configuration interface
 */
export interface TableConfig {
  columns?: TableColumn[];
  style?: keyof typeof TABLE_CONFIG.STYLES;
  includeHeaders?: boolean;
  maxWidth?: number;
  padding?: number;
  title?: string;
}

/**
 * Summary Formatter
 * Creates structured tables for trip summaries and key information
 */
export class SummaryFormatter {
  /**
   * Create a trip summary table
   */
  createSummary(data: ItineraryData): string {
    const summaryData = this.extractSummaryData(data);
    return this.createTable(summaryData.columns, summaryData.rows, {
      style: 'simple',
      includeHeaders: true,
      title: 'Trip Summary',
    });
  }

  /**
   * Create a budget breakdown table
   */
  createBudgetTable(data: ItineraryData): string {
    if (!data.budget) return '';

    const columns: TableColumn[] = [
      { key: 'category', header: 'Category', width: 15, align: 'left' },
      {
        key: 'amount',
        header: 'Amount',
        width: 12,
        align: 'right',
        formatter: (value) => `${data.budget!.currency}${value}`,
      },
      {
        key: 'percentage',
        header: '%',
        width: 8,
        align: 'right',
        formatter: (value) => `${value}%`,
      },
    ];

    const total = data.budget.total;
    const rows: TableRow[] = [
      {
        category: 'Accommodations',
        amount: data.budget.breakdown.accommodations,
        percentage: Math.round((data.budget.breakdown.accommodations / total) * 100),
      },
      {
        category: 'Transportation',
        amount: data.budget.breakdown.transportation,
        percentage: Math.round((data.budget.breakdown.transportation / total) * 100),
      },
      {
        category: 'Activities',
        amount: data.budget.breakdown.activities,
        percentage: Math.round((data.budget.breakdown.activities / total) * 100),
      },
      {
        category: 'Dining',
        amount: data.budget.breakdown.dining,
        percentage: Math.round((data.budget.breakdown.dining / total) * 100),
      },
      {
        category: 'Miscellaneous',
        amount: data.budget.breakdown.miscellaneous,
        percentage: Math.round((data.budget.breakdown.miscellaneous / total) * 100),
      },
      { category: 'TOTAL', amount: total, percentage: 100 },
    ];

    return this.createTable(columns, rows, {
      style: 'double',
      includeHeaders: true,
      title: 'Budget Breakdown',
    });
  }

  /**
   * Create an accommodations summary table
   */
  createAccommodationsTable(data: ItineraryData): string {
    if (!data.accommodations || data.accommodations.length === 0) return '';

    const columns: TableColumn[] = [
      { key: 'name', header: 'Hotel', width: 20, align: 'left' },
      { key: 'location', header: 'Location', width: 15, align: 'left' },
      { key: 'nights', header: 'Nights', width: 8, align: 'center' },
      {
        key: 'cost',
        header: 'Cost',
        width: 10,
        align: 'right',
        formatter: (value) => `${data.budget?.currency || '$'}${value}`,
      },
      {
        key: 'rating',
        header: 'Rating',
        width: 8,
        align: 'center',
        formatter: (value) => (value ? `${value}⭐` : 'N/A'),
      },
    ];

    const rows: TableRow[] = data.accommodations.map((acc) => ({
      name: acc.name,
      location: acc.location,
      nights: acc.nights,
      cost: acc.cost,
      rating: acc.rating,
    }));

    return this.createTable(columns, rows, {
      style: 'simple',
      includeHeaders: true,
      title: 'Accommodations',
    });
  }

  /**
   * Create a transportation summary table
   */
  createTransportationTable(data: ItineraryData): string {
    if (!data.transportation || data.transportation.length === 0) return '';

    const columns: TableColumn[] = [
      { key: 'type', header: 'Type', width: 12, align: 'left' },
      {
        key: 'route',
        header: 'Route',
        width: 20,
        align: 'left',
        formatter: (value) => `${value.from} → ${value.to}`,
      },
      { key: 'departure', header: 'Departure', width: 12, align: 'center' },
      { key: 'duration', header: 'Duration', width: 10, align: 'center' },
      {
        key: 'cost',
        header: 'Cost',
        width: 10,
        align: 'right',
        formatter: (value) => `${data.budget?.currency || '$'}${value}`,
      },
    ];

    const rows: TableRow[] = data.transportation.map((trans) => ({
      type: trans.type,
      route: trans,
      departure: trans.departure,
      duration: trans.duration,
      cost: trans.cost,
    }));

    return this.createTable(columns, rows, {
      style: 'simple',
      includeHeaders: true,
      title: 'Transportation',
    });
  }

  /**
   * Create an activities summary table
   */
  createActivitiesTable(data: ItineraryData): string {
    if (!data.activities || data.activities.length === 0) return '';

    const columns: TableColumn[] = [
      { key: 'name', header: 'Activity', width: 25, align: 'left' },
      { key: 'category', header: 'Category', width: 12, align: 'left' },
      { key: 'location', header: 'Location', width: 15, align: 'left' },
      { key: 'duration', header: 'Duration', width: 10, align: 'center' },
      {
        key: 'cost',
        header: 'Cost',
        width: 10,
        align: 'right',
        formatter: (value) => (value ? `${data.budget?.currency || '$'}${value}` : 'Free'),
      },
    ];

    const rows: TableRow[] = data.activities.slice(0, 10).map((activity) => ({
      name: activity.name,
      category: activity.category,
      location: activity.location,
      duration: activity.duration,
      cost: activity.cost,
    }));

    return this.createTable(columns, rows, {
      style: 'simple',
      includeHeaders: true,
      title: 'Key Activities',
    });
  }

  /**
   * Create a dining summary table
   */
  createDiningTable(data: ItineraryData): string {
    if (!data.dining || data.dining.length === 0) return '';

    const columns: TableColumn[] = [
      { key: 'name', header: 'Restaurant', width: 20, align: 'left' },
      { key: 'cuisine', header: 'Cuisine', width: 12, align: 'left' },
      { key: 'location', header: 'Location', width: 15, align: 'left' },
      {
        key: 'cost',
        header: 'Cost',
        width: 10,
        align: 'right',
        formatter: (value) => `${data.budget?.currency || '$'}${value}`,
      },
      {
        key: 'rating',
        header: 'Rating',
        width: 8,
        align: 'center',
        formatter: (value) => (value ? `${value}⭐` : 'N/A'),
      },
    ];

    const rows: TableRow[] = data.dining.slice(0, 8).map((dining) => ({
      name: dining.name,
      cuisine: dining.cuisine,
      location: dining.location,
      cost: dining.cost,
      rating: dining.rating,
    }));

    return this.createTable(columns, rows, {
      style: 'simple',
      includeHeaders: true,
      title: 'Recommended Dining',
    });
  }

  /**
   * Create a comprehensive trip overview table
   */
  createTripOverview(data: ItineraryData): string {
    const columns: TableColumn[] = [
      { key: 'aspect', header: 'Aspect', width: 15, align: 'left' },
      { key: 'details', header: 'Details', width: 35, align: 'left' },
    ];

    const rows: TableRow[] = [
      { aspect: 'Destination', details: data.destination },
      { aspect: 'Duration', details: `${data.duration.days} days, ${data.duration.nights} nights` },
      {
        aspect: 'Travelers',
        details: `${data.travelers.total} people (${data.travelers.adults} adults, ${data.travelers.children} children)`,
      },
      {
        aspect: 'Budget',
        details: data.budget
          ? `${data.budget.currency}${data.budget.total} total`
          : 'Not specified',
      },
      { aspect: 'Accommodations', details: `${data.accommodations?.length || 0} bookings` },
      { aspect: 'Activities', details: `${data.activities?.length || 0} planned` },
      { aspect: 'Dining', details: `${data.dining?.length || 0} recommendations` },
      { aspect: 'Transportation', details: `${data.transportation?.length || 0} segments` },
    ];

    return this.createTable(columns, rows, {
      style: 'double',
      includeHeaders: true,
      title: 'Trip Overview',
    });
  }

  /**
   * Create a custom table from data
   */
  createTable(columns: TableColumn[], rows: TableRow[], config: TableConfig): string {
    const style = TABLE_CONFIG.STYLES[config.style || TABLE_CONFIG.DEFAULT_STYLE];
    const padding = config.padding || TABLE_CONFIG.PADDING;

    // Calculate column widths
    const calculatedColumns = this.calculateColumnWidths(columns, rows);

    // Create table content
    const tableLines: string[] = [];

    // Title
    if (config.title) {
      tableLines.push(config.title);
      tableLines.push('='.repeat(config.title.length));
      tableLines.push('');
    }

    // Headers
    if (config.includeHeaders !== false) {
      const headerLine = this.createTableRow(
        calculatedColumns,
        columns.map((col) => col.header),
        style,
        padding,
        'center'
      );
      tableLines.push(headerLine);

      // Header separator
      const separatorLine = this.createSeparatorRow(calculatedColumns, style);
      tableLines.push(separatorLine);
    }

    // Data rows
    for (const row of rows) {
      const rowLine = this.createTableRow(
        calculatedColumns,
        columns.map((col) => {
          const value = row[col.key];
          return col.formatter ? col.formatter(value) : String(value || '');
        }),
        style,
        padding,
        'left'
      );
      tableLines.push(rowLine);
    }

    return tableLines.join('\n');
  }

  /**
   * Private helper methods
   */

  private extractSummaryData(data: ItineraryData): { columns: TableColumn[]; rows: TableRow[] } {
    const columns: TableColumn[] = [
      { key: 'metric', header: 'Metric', width: 15, align: 'left' },
      { key: 'value', header: 'Value', width: 25, align: 'left' },
    ];

    const rows: TableRow[] = [
      { metric: 'Destination', value: data.destination },
      { metric: 'Duration', value: `${data.duration.days} days` },
      { metric: 'Travelers', value: `${data.travelers.total}` },
      {
        metric: 'Total Budget',
        value: data.budget ? `${data.budget.currency}${data.budget.total}` : 'N/A',
      },
      { metric: 'Accommodations', value: `${data.accommodations?.length || 0}` },
      { metric: 'Activities', value: `${data.activities?.length || 0}` },
      { metric: 'Dining Spots', value: `${data.dining?.length || 0}` },
      { metric: 'Transport', value: `${data.transportation?.length || 0}` },
    ];

    return { columns, rows };
  }

  private calculateColumnWidths(columns: TableColumn[], rows: TableRow[]): TableColumn[] {
    return columns.map((col) => {
      const headerWidth = col.header.length;
      const dataWidths = rows.map((row) => {
        const value = row[col.key];
        const formatted = col.formatter ? col.formatter(value) : String(value || '');
        return formatted.length;
      });

      const maxDataWidth = Math.max(...dataWidths, 0);
      const calculatedWidth = Math.max(
        col.width || TABLE_CONFIG.MIN_COLUMN_WIDTH,
        headerWidth,
        maxDataWidth
      );

      return {
        ...col,
        width: Math.min(calculatedWidth, TABLE_CONFIG.MAX_COLUMN_WIDTH),
      };
    });
  }

  private createTableRow(
    columns: TableColumn[],
    values: string[],
    style: (typeof TABLE_CONFIG.STYLES)[keyof typeof TABLE_CONFIG.STYLES],
    padding: number,
    defaultAlign: 'left' | 'center' | 'right' = 'left'
  ): string {
    const cells: string[] = [];

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      if (!column) continue;

      const value = values[i] || '';
      const width = column.width!;
      const align = column.align || defaultAlign;

      const paddedValue = this.alignText(value, width, align, padding);
      cells.push(paddedValue);
    }

    return style.left + cells.join(style.cross) + style.right;
  }

  private createSeparatorRow(
    columns: TableColumn[],
    style: (typeof TABLE_CONFIG.STYLES)[keyof typeof TABLE_CONFIG.STYLES]
  ): string {
    const separators: string[] = [];

    for (const column of columns) {
      separators.push(style.headerSeparator.repeat(column.width!));
    }

    return style.left + separators.join(style.cross) + style.right;
  }

  private alignText(
    text: string,
    width: number,
    align: 'left' | 'center' | 'right',
    padding: number
  ): string {
    const totalWidth = width + padding * 2;
    const paddedText = ' '.repeat(padding) + text + ' '.repeat(padding);
    const textLength = paddedText.length;

    if (textLength >= totalWidth) {
      return paddedText.substring(0, totalWidth);
    }

    switch (align) {
      case 'center':
        const leftPad = Math.floor((totalWidth - textLength) / 2);
        const rightPad = totalWidth - textLength - leftPad;
        return ' '.repeat(leftPad) + paddedText + ' '.repeat(rightPad);
      case 'right':
        return ' '.repeat(totalWidth - textLength) + paddedText;
      case 'left':
      default:
        return paddedText + ' '.repeat(totalWidth - textLength);
    }
  }
}

/**
 * Global summary formatter instance
 */
export const summaryFormatter = new SummaryFormatter();

/**
 * Convenience functions for common table operations
 */

/**
 * Create a trip summary table
 */
export function createSummary(data: ItineraryData): string {
  return summaryFormatter.createSummary(data);
}

/**
 * Create a budget breakdown table
 */
export function createBudgetTable(data: ItineraryData): string {
  return summaryFormatter.createBudgetTable(data);
}

/**
 * Create an accommodations table
 */
export function createAccommodationsTable(data: ItineraryData): string {
  return summaryFormatter.createAccommodationsTable(data);
}

/**
 * Create a transportation table
 */
export function createTransportationTable(data: ItineraryData): string {
  return summaryFormatter.createTransportationTable(data);
}

/**
 * Create an activities table
 */
export function createActivitiesTable(data: ItineraryData): string {
  return summaryFormatter.createActivitiesTable(data);
}

/**
 * Create a dining table
 */
export function createDiningTable(data: ItineraryData): string {
  return summaryFormatter.createDiningTable(data);
}

/**
 * Create a trip overview table
 */
export function createTripOverview(data: ItineraryData): string {
  return summaryFormatter.createTripOverview(data);
}

/**
 * Create a custom table
 */
export function createTable(columns: TableColumn[], rows: TableRow[], config: TableConfig): string {
  return summaryFormatter.createTable(columns, rows, config);
}

/**
 * Export types
 */
