/**
 * HighlightManager - Handles visual highlighting, tooltips, and styling
 */

import type {
  ElementId,
  ElementData,
  HighlightOptions,
  HighlightInfo,
  Category
} from './types.js';

import type { Logger } from './logger.js';

export class HighlightManager {
  private highlights: Map<ElementId, HighlightInfo> = new Map();
  private highlightStyles: HTMLStyleElement | null = null;

  constructor(
    private elements: Map<ElementId, ElementData>,
    private emitEvent: (eventName: string, detail: any) => void,
    private logger: Logger
  ) {
    this.injectHighlightStyles();
  }

  /**
   * Highlight an element with specific style and optional tooltip
   */
  highlightElement(
    elementId: ElementId, 
    style: string = 'default', 
    options: HighlightOptions = {}
  ): boolean {
    const data = this.elements.get(elementId);
    if (!data || !data.visible) return false;

    const highlightInfo: HighlightInfo = {
      style,
      startTime: Date.now(),
      duration: options.duration ?? 5000,
      tooltip: options.tooltip ?? data.helpText ?? undefined,
      persistent: options.persistent ?? false,
      onDismiss: options.onDismiss
    };

    this.highlights.set(elementId, highlightInfo);
    this.applyHighlight(elementId, highlightInfo);

    // Auto-remove highlight after duration (unless persistent)
    if (!highlightInfo.persistent) {
      setTimeout(() => {
        this.removeHighlight(elementId);
      }, highlightInfo.duration);
    }

    this.emitEvent('uiflow:highlight-added', { elementId, style, options });
    return true;
  }

  /**
   * Remove highlight from element
   */
  removeHighlight(elementId: ElementId): boolean {
    const highlightInfo = this.highlights.get(elementId);
    if (!highlightInfo) return false;

    const data = this.elements.get(elementId);
    if (data) {
      data.element.classList.remove(`uiflow-highlight-${highlightInfo.style}`);
      data.element.removeAttribute('data-uiflow-tooltip');
      
      // Remove tooltip if it exists
      const tooltip = data.element.querySelector('.uiflow-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    }

    this.highlights.delete(elementId);
    
    if (highlightInfo.onDismiss) {
      highlightInfo.onDismiss(elementId);
    }

    this.emitEvent('uiflow:highlight-removed', { elementId });
    return true;
  }

  /**
   * Flag element as new with optional help text
   */
  flagAsNew(elementId: ElementId, helpText?: string, duration: number = 8000): boolean {
    const data = this.elements.get(elementId);
    if (!data) return false;

    data.isNew = true;
    if (helpText) {
      data.helpText = helpText;
      data.element.setAttribute('data-uiflow-help', helpText);
    }

    // If element is currently visible, highlight it immediately
    if (data.visible) {
      this.highlightElement(elementId, 'new-feature', {
        duration,
        tooltip: helpText ?? 'New feature available!'
      });
    }

    return true;
  }

  /**
   * Show tooltip for element
   */
  showTooltip(elementId: ElementId, text: string, options: Partial<HighlightOptions> = {}): boolean {
    return this.highlightElement(elementId, 'tooltip', {
      tooltip: text,
      duration: options.duration ?? 3000,
      persistent: options.persistent ?? false
    });
  }

  /**
   * Clear all highlights
   */
  clearAllHighlights(): void {
    for (const elementId of this.highlights.keys()) {
      this.removeHighlight(elementId);
    }
  }

  /**
   * Get currently highlighted elements
   */
  getHighlights(): ElementId[] {
    return Array.from(this.highlights.keys());
  }

  /**
   * Get elements for demo features (controlled access)
   */
  getNewVisibleElements(): Array<{ elementId: ElementId; helpText: string | undefined }> {
    return Array.from(this.elements.entries())
      .filter(([_, data]) => data.isNew && data.visible)
      .map(([elementId, data]) => ({ elementId, helpText: data.helpText }));
  }

  getVisibleElementsWithHelp(): Array<{ elementId: ElementId; helpText: string }> {
    return Array.from(this.elements.entries())
      .filter(([_, data]) => data.visible && data.helpText)
      .map(([elementId, data]) => ({ elementId, helpText: data.helpText! }));
  }

  getVisibleElementsSorted(): Array<{ elementId: ElementId; category: Category; helpText: string | undefined }> {
    return Array.from(this.elements.entries())
      .filter(([_, data]) => data.visible && data.helpText)
      .sort(([, a], [, b]) => {
        const order = { basic: 0, advanced: 1, expert: 2 };
        return order[a.category] - order[b.category];
      })
      .map(([elementId, data]) => ({ elementId, category: data.category, helpText: data.helpText }));
  }

  /**
   * Apply highlight styling to element
   */
  private applyHighlight(elementId: ElementId, highlightInfo: HighlightInfo): void {
    const data = this.elements.get(elementId);
    if (!data) return;

    const element = data.element;
    element.classList.add(`uiflow-highlight-${highlightInfo.style}`);

    // Add tooltip if provided
    if (highlightInfo.tooltip) {
      this.createTooltip(element, highlightInfo.tooltip);
    }

    // Make element focusable for accessibility
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  }

  /**
   * Create and position tooltip
   */
  private createTooltip(element: HTMLElement, text: string): void {
    // Remove existing tooltip
    const existingTooltip = element.querySelector('.uiflow-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'uiflow-tooltip';
    tooltip.textContent = text;
    tooltip.setAttribute('role', 'tooltip');
    
    element.appendChild(tooltip);
    element.setAttribute('aria-describedby', tooltip.id = `uiflow-tooltip-${Date.now()}`);

    // Position tooltip
    this.positionTooltip(element, tooltip);

    // Add click to dismiss
    tooltip.addEventListener('click', (e) => {
      e.stopPropagation();
      const elementId = element.getAttribute('data-uiflow-id');
      if (elementId) {
        this.removeHighlight(elementId);
      }
    });
  }

  /**
   * Position tooltip relative to element
   */
  private positionTooltip(element: HTMLElement, tooltip: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Position above element by default
    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    
    // Adjust if tooltip would go off screen
    if (top < 8) {
      top = rect.bottom + 8; // Position below instead
    }
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    
    tooltip.style.position = 'fixed';
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
    tooltip.style.zIndex = '9999';
  }

  /**
   * Inject CSS styles for highlights and tooltips
   */
  private injectHighlightStyles(): void {
    if (this.highlightStyles) return;

    const styles = `
      .uiflow-highlight-default {
        position: relative;
        animation: uiflow-pulse 2s infinite;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4) !important;
      }
      
      .uiflow-highlight-new-feature {
        position: relative;
        animation: uiflow-glow 2s infinite alternate;
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.6) !important;
      }
      
      .uiflow-highlight-new-feature::before {
        content: "NEW";
        position: absolute;
        top: -8px;
        right: -8px;
        background: #22c55e;
        color: white;
        font-size: 10px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 10px;
        z-index: 10;
      }
      
      .uiflow-highlight-tooltip {
        box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.4) !important;
      }
      
      .uiflow-tooltip {
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        max-width: 200px;
        line-height: 1.4;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .uiflow-tooltip::before {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: #1f2937;
      }
      
      .uiflow-tooltip:hover {
        background: #374151;
      }
      
      @keyframes uiflow-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      @keyframes uiflow-glow {
        0% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.6) !important; }
        100% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.3) !important; }
      }
    `;

    this.highlightStyles = document.createElement('style');
    this.highlightStyles.textContent = styles;
    document.head.appendChild(this.highlightStyles);
  }

  /**
   * Clean up styles and resources
   */
  destroy(): void {
    this.clearAllHighlights();
    
    if (this.highlightStyles) {
      this.highlightStyles.remove();
      this.highlightStyles = null;
    }
  }
}
