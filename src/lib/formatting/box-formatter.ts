/**
 * ASCII Art Box Generation
 * Beautiful ASCII art boxes for content formatting and visual separation
 */

import { ITINERARY_CONFIG } from './itinerary-formatter';

/**
 * Box style configuration
 */
export const BOX_STYLES = {
  single: {
    horizontal: '─',
    vertical: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    cross: '┼',
    leftCross: '├',
    rightCross: '┤',
    topCross: '┬',
    bottomCross: '┴',
  },
  double: {
    horizontal: '═',
    vertical: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    cross: '╬',
    leftCross: '╠',
    rightCross: '╣',
    topCross: '╦',
    bottomCross: '╩',
  },
  rounded: {
    horizontal: '─',
    vertical: '│',
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    cross: '┼',
    leftCross: '├',
    rightCross: '┤',
    topCross: '┬',
    bottomCross: '┴',
  },
  bold: {
    horizontal: '━',
    vertical: '┃',
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    cross: '╋',
    leftCross: '┣',
    rightCross: '┫',
    topCross: '┳',
    bottomCross: '┻',
  },
  dotted: {
    horizontal: '┈',
    vertical: '┊',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    cross: '┼',
    leftCross: '├',
    rightCross: '┤',
    topCross: '┬',
    bottomCross: '┴',
  },
} as const;

/**
 * Box configuration interface
 */
export interface BoxConfig {
  width?: number;
  maxWidth?: number;
  minWidth?: number;
  padding?: number;
  margin?: number;
  align?: 'left' | 'center' | 'right';
  style?: keyof typeof BOX_STYLES;
  title?: string;
  titleAlign?: 'left' | 'center' | 'right';
  wrapText?: boolean;
  wordWrap?: boolean;
}

/**
 * Box formatter class
 */
export class BoxFormatter {
  private defaultConfig: BoxConfig = {
    width: ITINERARY_CONFIG.BOX_WIDTH,
    maxWidth: 120,
    minWidth: 20,
    padding: 1,
    margin: 0,
    align: 'left',
    style: 'single',
    titleAlign: 'center',
    wrapText: true,
    wordWrap: true,
  };

  /**
   * Create a box around content
   */
  createBox(
    content: string,
    title?: string,
    style: keyof typeof BOX_STYLES = 'single',
    config?: Partial<BoxConfig>
  ): string {
    const finalConfig = { ...this.defaultConfig, ...config, style };

    // Process content
    const processedContent = this.processContent(content, finalConfig);

    // Calculate dimensions
    const lines = processedContent.split('\n');
    const contentWidth = Math.max(...lines.map((line) => this.getVisibleLength(line)));
    const boxWidth = Math.min(
      finalConfig.maxWidth!,
      Math.max(finalConfig.minWidth!, contentWidth + finalConfig.padding! * 2)
    );

    // Create box
    const boxStyle = BOX_STYLES[style];
    const result: string[] = [];

    // Top border with title
    if (title) {
      result.push(this.createTopBorderWithTitle(boxWidth, title, boxStyle, finalConfig));
    } else {
      result.push(this.createTopBorder(boxWidth, boxStyle));
    }

    // Content lines
    for (const line of lines) {
      result.push(this.createContentLine(line, boxWidth, boxStyle, finalConfig));
    }

    // Bottom border
    result.push(this.createBottomBorder(boxWidth, boxStyle));

    return result.join('\n');
  }

  /**
   * Create multiple boxes in a grid layout
   */
  createBoxGrid(
    boxes: Array<{ content: string; title?: string; config?: Partial<BoxConfig> }>,
    columns: number = 2,
    style: keyof typeof BOX_STYLES = 'single'
  ): string {
    if (boxes.length === 0) return '';

    // Calculate layout
    const rows = Math.ceil(boxes.length / columns);
    const grid: string[][] = [];

    // Initialize grid
    for (let i = 0; i < rows; i++) {
      grid[i] = new Array(columns).fill('');
    }

    // Fill grid with boxes
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        const boxIndex = i * columns + j;
        if (boxIndex < boxes.length) {
          const box = boxes[boxIndex];
          if (box) {
            const boxContent = this.createBox(box.content, box.title, style, {
              width: Math.floor(ITINERARY_CONFIG.BOX_WIDTH / columns) - 2,
              ...box.config,
            });
            grid[i]![j] = boxContent;
          }
        }
      }
    }

    // Combine rows
    const result: string[] = [];
    for (let row = 0; row < rows; row++) {
      const rowLines = grid[row].map((box) => box.split('\n')).filter((lines) => lines.length > 0);

      if (rowLines.length === 0) continue;

      const maxLines = Math.max(...rowLines.map((lines) => lines.length));

      for (let line = 0; line < maxLines; line++) {
        const lineParts = rowLines.map((lines) => lines[line] || '');
        result.push(lineParts.join('  '));
      }

      // Add spacing between rows
      if (row < rows - 1) {
        result.push('');
      }
    }

    return result.join('\n');
  }

  /**
   * Create a separator line
   */
  createSeparator(
    width: number = ITINERARY_CONFIG.BOX_WIDTH,
    style: keyof typeof BOX_STYLES = 'single',
    char?: string
  ): string {
    const boxStyle = BOX_STYLES[style];
    const separatorChar = char || boxStyle.horizontal;
    return separatorChar.repeat(width);
  }

  /**
   * Create a section divider with title
   */
  createSectionDivider(
    title: string,
    width: number = ITINERARY_CONFIG.BOX_WIDTH,
    style: keyof typeof BOX_STYLES = 'single'
  ): string {
    const boxStyle = BOX_STYLES[style];
    const titleLength = this.getVisibleLength(title);
    const padding = Math.max(2, Math.floor((width - titleLength - 4) / 2));
    const leftPadding = ' '.repeat(padding);
    const rightPadding = ' '.repeat(width - titleLength - padding * 2 - 4);

    return `${boxStyle.leftCross}${leftPadding} ${title} ${rightPadding}${boxStyle.rightCross}`;
  }

  /**
   * Create a progress bar
   */
  createProgressBar(
    progress: number, // 0-1
    width: number = 20,
    style: keyof typeof BOX_STYLES = 'single'
  ): string {
    const boxStyle = BOX_STYLES[style];
    const filled = Math.round(progress * width);
    const empty = width - filled;

    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);
    const percentage = Math.round(progress * 100);

    return `${boxStyle.vertical} ${filledBar}${emptyBar} ${percentage}% ${boxStyle.vertical}`;
  }

  /**
   * Create a status indicator
   */
  createStatusIndicator(
    status: 'success' | 'warning' | 'error' | 'info',
    message: string,
    style: keyof typeof BOX_STYLES = 'single'
  ): string {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️',
    };

    const colors = {
      success: '🟢',
      warning: '🟡',
      error: '🔴',
      info: '🔵',
    };

    const boxStyle = BOX_STYLES[style];
    const icon = icons[status];
    const color = colors[status];

    return `${boxStyle.vertical} ${icon} ${color} ${message} ${boxStyle.vertical}`;
  }

  /**
   * Private helper methods
   */

  private processContent(content: string, config: BoxConfig): string {
    if (!config.wrapText) return content;

    const lines = content.split('\n');
    const processedLines: string[] = [];

    for (const line of lines) {
      if (config.wordWrap && line.length > config.width! - config.padding! * 2) {
        processedLines.push(...this.wordWrap(line, config.width! - config.padding! * 2));
      } else {
        processedLines.push(line);
      }
    }

    return processedLines.join('\n');
  }

  private wordWrap(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (this.getVisibleLength(currentLine + ' ' + word) <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private getVisibleLength(text: string): number {
    // Remove ANSI escape codes and count visible characters
    return text.replace(/\u001b\[[0-9;]*m/g, '').length;
  }

  private createTopBorder(
    width: number,
    boxStyle: (typeof BOX_STYLES)[keyof typeof BOX_STYLES]
  ): string {
    return boxStyle.topLeft + boxStyle.horizontal.repeat(width - 2) + boxStyle.topRight;
  }

  private createTopBorderWithTitle(
    width: number,
    title: string,
    boxStyle: (typeof BOX_STYLES)[keyof typeof BOX_STYLES],
    config: BoxConfig
  ): string {
    const titleLength = this.getVisibleLength(title);
    let leftPadding = '';
    let rightPadding = '';

    switch (config.titleAlign) {
      case 'left':
        leftPadding = ' ';
        rightPadding = ' '.repeat(width - titleLength - 4);
        break;
      case 'right':
        leftPadding = ' '.repeat(width - titleLength - 4);
        rightPadding = ' ';
        break;
      case 'center':
      default:
        const totalPadding = width - titleLength - 4;
        const leftPad = Math.floor(totalPadding / 2);
        const rightPad = totalPadding - leftPad;
        leftPadding = ' '.repeat(leftPad);
        rightPadding = ' '.repeat(rightPad);
        break;
    }

    return `${boxStyle.topLeft}${boxStyle.horizontal}${leftPadding} ${title} ${rightPadding}${boxStyle.horizontal}${boxStyle.topRight}`;
  }

  private createContentLine(
    content: string,
    boxWidth: number,
    boxStyle: (typeof BOX_STYLES)[keyof typeof BOX_STYLES],
    config: BoxConfig
  ): string {
    const contentWidth = boxWidth - 2; // Account for vertical borders
    const padding = ' '.repeat(config.padding!);

    let alignedContent: string;
    switch (config.align) {
      case 'center':
        const totalPadding = contentWidth - this.getVisibleLength(content) - config.padding! * 2;
        const leftPad = Math.floor(totalPadding / 2);
        const rightPad = totalPadding - leftPad;
        alignedContent = ' '.repeat(leftPad) + content + ' '.repeat(rightPad);
        break;
      case 'right':
        alignedContent =
          ' '.repeat(contentWidth - this.getVisibleLength(content) - config.padding! * 2) + content;
        break;
      case 'left':
      default:
        alignedContent =
          content + ' '.repeat(contentWidth - this.getVisibleLength(content) - config.padding! * 2);
        break;
    }

    return `${boxStyle.vertical}${padding}${alignedContent}${padding}${boxStyle.vertical}`;
  }

  private createBottomBorder(
    width: number,
    boxStyle: (typeof BOX_STYLES)[keyof typeof BOX_STYLES]
  ): string {
    return boxStyle.bottomLeft + boxStyle.horizontal.repeat(width - 2) + boxStyle.bottomRight;
  }
}

/**
 * Global box formatter instance
 */
export const boxFormatter = new BoxFormatter();

/**
 * Convenience functions for common box operations
 */

/**
 * Create a simple box
 */
export function createBox(
  content: string,
  title?: string,
  style: keyof typeof BOX_STYLES = 'single',
  config?: Partial<BoxConfig>
): string {
  return boxFormatter.createBox(content, title, style, config);
}

/**
 * Create a box grid
 */
export function createBoxGrid(
  boxes: Array<{ content: string; title?: string; config?: Partial<BoxConfig> }>,
  columns: number = 2,
  style: keyof typeof BOX_STYLES = 'single'
): string {
  return boxFormatter.createBoxGrid(boxes, columns, style);
}

/**
 * Create a separator
 */
export function createSeparator(
  width: number = ITINERARY_CONFIG.BOX_WIDTH,
  style: keyof typeof BOX_STYLES = 'single',
  char?: string
): string {
  return boxFormatter.createSeparator(width, style, char);
}

/**
 * Create a section divider
 */
export function createSectionDivider(
  title: string,
  width: number = ITINERARY_CONFIG.BOX_WIDTH,
  style: keyof typeof BOX_STYLES = 'single'
): string {
  return boxFormatter.createSectionDivider(title, width, style);
}

/**
 * Create a progress bar
 */
export function createProgressBar(
  progress: number,
  width: number = 20,
  style: keyof typeof BOX_STYLES = 'single'
): string {
  return boxFormatter.createProgressBar(progress, width, style);
}

/**
 * Create a status indicator
 */
export function createStatusIndicator(
  status: 'success' | 'warning' | 'error' | 'info',
  message: string,
  style: keyof typeof BOX_STYLES = 'single'
): string {
  return boxFormatter.createStatusIndicator(status, message, style);
}

/**
 * Export types
 */
