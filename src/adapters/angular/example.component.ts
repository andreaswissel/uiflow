/**
 * UIFlow Angular Adapter - Usage Example Component
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  UIFlowService, 
  UIFLOW_COMPONENTS,
  UIFlowElementDirective,
  UIFlowIfDirective,
  UIFlowDensityIndicatorComponent,
  UIFlowDensityControlComponent
} from './index';

@Component({
  selector: 'app-uiflow-example',
  standalone: true,
  imports: [
    CommonModule,
    ...UIFLOW_COMPONENTS
  ],
  template: `
    <div class="app">
      <!-- Header with categorized elements -->
      <header class="header">
        <h1>My Angular App</h1>
        
        <!-- Always visible basic button -->
        <button uiflowElement="basic" uiflowArea="header">
          Save
        </button>
        
        <!-- Advanced export button -->
        <button 
          uiflowElement="advanced" 
          uiflowArea="header"
          uiflowHelpText="Export your data in various formats"
          [uiflowIsNew]="true">
          Export
        </button>
        
        <!-- Expert-level batch operations -->
        <button 
          uiflowElement="expert" 
          uiflowArea="header"
          uiflowHelpText="Bulk operations for power users">
          Batch Operations
        </button>
        
        <!-- Density indicator -->
        <uiflow-density-indicator area="header"></uiflow-density-indicator>
      </header>

      <!-- Main content area -->
      <main class="main-content">
        <h2>Editor (Density: {{ (editorDensity$ | async) | number:'1.0-0' }}%)</h2>
        
        <!-- Basic text editing always available -->
        <textarea 
          uiflowElement="basic" 
          uiflowArea="editor"
          placeholder="Start typing...">
        </textarea>
        
        <!-- Conditional formatting toolbar -->
        <div class="formatting-toolbar" *uiflowIf="'advanced'; uiflowIfArea: 'editor'">
          <button uiflowElement="advanced" uiflowArea="editor">Bold</button>
          <button uiflowElement="advanced" uiflowArea="editor">Italic</button>
          <button uiflowElement="expert" uiflowArea="editor">Insert Table</button>
        </div>
        
        <!-- Expert features only at high density -->
        <div *uiflowIf="'expert'; uiflowIfArea: 'editor'" class="advanced-editor">
          <h3>Code Editor</h3>
          <textarea placeholder="// Advanced code editing..."></textarea>
        </div>
      </main>

      <!-- Sidebar with controls -->
      <aside class="sidebar">
        <h3>Controls</h3>
        
        <button 
          uiflowElement="basic" 
          uiflowArea="sidebar"
          (click)="simulateBeginner()">
          Simulate Beginner Usage
        </button>
        
        <button 
          uiflowElement="advanced" 
          uiflowArea="sidebar"
          (click)="simulateExpert()">
          Simulate Expert Usage
        </button>
        
        <button 
          uiflowElement="expert" 
          uiflowArea="sidebar"
          uiflowHelpText="Highlight features for user education"
          (click)="highlightFeature()">
          Highlight Feature
        </button>
        
        <!-- Manual density controls -->
        <div *uiflowIf="'advanced'; uiflowIfArea: 'sidebar'">
          <uiflow-density-control 
            area="editor"
            (densityChange)="onDensityChange($event)">
          </uiflow-density-control>
        </div>
        
        <!-- Event log -->
        <div class="event-log" *uiflowIf="'expert'; uiflowIfArea: 'sidebar'">
          <h4>Events</h4>
          <div class="log-entries">
            <div *ngFor="let event of eventLog" class="log-entry">
              <small>{{ event.timestamp | date:'HH:mm:ss' }}</small>
              <span>{{ event.message }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .app {
      display: grid;
      grid-template-areas: 
        "header header"
        "main sidebar";
      grid-template-columns: 1fr 300px;
      grid-template-rows: auto 1fr;
      height: 100vh;
      gap: 1rem;
      padding: 1rem;
    }

    .header {
      grid-area: header;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f3f4f6;
      border-radius: 8px;
    }

    .main-content {
      grid-area: main;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .sidebar {
      grid-area: sidebar;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .formatting-toolbar {
      display: flex;
      gap: 0.5rem;
      margin: 1rem 0;
      padding: 0.5rem;
      background: #f3f4f6;
      border-radius: 4px;
    }

    .advanced-editor {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 2px dashed #cbd5e1;
    }

    textarea {
      width: 100%;
      height: 200px;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      resize: vertical;
    }

    .advanced-editor textarea {
      height: 150px;
      font-family: 'Courier New', monospace;
      background: #1f2937;
      color: #f9fafb;
    }

    button {
      padding: 0.5rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
      margin-bottom: 0.5rem;
    }

    button:hover {
      background: #2563eb;
    }

    .formatting-toolbar button {
      width: auto;
      margin-bottom: 0;
    }

    h1, h2, h3, h4 {
      margin: 0 0 1rem 0;
    }

    .event-log {
      margin-top: 1rem;
    }

    .log-entries {
      max-height: 200px;
      overflow-y: auto;
      background: white;
      border-radius: 4px;
      padding: 0.5rem;
    }

    .log-entry {
      display: flex;
      flex-direction: column;
      padding: 0.25rem 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .log-entry:last-child {
      border-bottom: none;
    }

    .log-entry small {
      color: #6b7280;
      font-size: 10px;
    }

    .log-entry span {
      font-size: 12px;
    }
  `]
})
export class UIFlowExampleComponent implements OnInit, OnDestroy {
  editorDensity$: Observable<number>;
  eventLog: Array<{ timestamp: Date; message: string }> = [];
  
  private destroy$ = new Subject<void>();

  constructor(private uiflowService: UIFlowService) {
    this.editorDensity$ = this.uiflowService.getDensity$('editor');
  }

  ngOnInit(): void {
    // Listen for UIFlow events
    this.setupEventListeners();
    
    // Log initial state
    this.addLogEntry('UIFlow example component initialized');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupEventListeners(): void {
    // Listen for density changes via DOM events (since Angular service handles observables)
    document.addEventListener('uiflow:adaptation', this.handleAdaptation.bind(this));
    document.addEventListener('uiflow:density-changed', this.handleDensityChange.bind(this));
    document.addEventListener('uiflow:sync-success', this.handleSyncSuccess.bind(this));
  }

  private handleAdaptation(event: any): void {
    const { area, newDensity, advancedRatio } = event.detail;
    this.addLogEntry(`Adapted ${area}: ${Math.round(newDensity * 100)}% (${Math.round(advancedRatio * 100)}% advanced usage)`);
  }

  private handleDensityChange(event: any): void {
    const { area, density } = event.detail;
    this.addLogEntry(`Density changed ${area}: ${Math.round(density * 100)}%`);
  }

  private handleSyncSuccess(event: any): void {
    this.addLogEntry(`Synced with: ${event.detail.sources.join(', ')}`);
  }

  simulateBeginner(): void {
    const interactions = Array(20).fill({ category: 'basic' });
    this.uiflowService.simulateUsage('editor', interactions, 7);
    this.addLogEntry('Simulated beginner usage (7 days, basic features)');
  }

  simulateExpert(): void {
    const interactions = [
      ...Array(5).fill({ category: 'basic' }),
      ...Array(10).fill({ category: 'advanced' }),
      ...Array(15).fill({ category: 'expert' })
    ];
    this.uiflowService.simulateUsage('editor', interactions, 7);
    this.addLogEntry('Simulated expert usage (7 days, mixed features)');
  }

  highlightFeature(): void {
    const advancedButton = document.querySelector('[data-uiflow-category="advanced"]');
    if (advancedButton) {
      const elementId = advancedButton.getAttribute('data-uiflow-id');
      if (elementId) {
        this.uiflowService.flagAsNew(elementId, 'Try this advanced feature!', 5000);
        this.addLogEntry('Highlighted advanced feature with tooltip');
      }
    }
  }

  onDensityChange(density: number): void {
    this.addLogEntry(`Manual density change: ${Math.round(density * 100)}%`);
  }

  private addLogEntry(message: string): void {
    this.eventLog.unshift({
      timestamp: new Date(),
      message
    });
    
    // Keep only last 20 entries
    if (this.eventLog.length > 20) {
      this.eventLog = this.eventLog.slice(0, 20);
    }
  }
}

/**
 * Standalone component bootstrap (Angular v19 ready)
 * 
 * Usage in main.ts:
 * ```typescript
 * import { bootstrapApplication } from '@angular/platform-browser';
 * import { UIFlowExampleComponent } from './uiflow-example.component';
 * import { UIFlowService } from './uiflow/angular';
 * 
 * bootstrapApplication(UIFlowExampleComponent, {
 *   providers: [
 *     UIFlowService,
 *     { 
 *       provide: 'UIFLOW_CONFIG', 
 *       useValue: { 
 *         userId: 'user-123', 
 *         categories: ['basic', 'advanced', 'expert'],
 *         learningRate: 0.1,
 *         dataSources: {
 *           api: { endpoint: 'https://api.example.com', primary: true }
 *         }
 *       } 
 *     }
 *   ]
 * });
 * ```
 */

/**
 * Example of custom directive for feature discovery
 */
import { Directive, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[uiflowAutoDiscover]',
  standalone: true
})
export class UIFlowAutoDiscoverDirective implements OnInit {
  @Input() uiflowAutoDiscover: string = 'default'; // area

  constructor(
    private elementRef: ElementRef,
    private uiflowService: UIFlowService
  ) {}

  ngOnInit(): void {
    // Auto-discover and highlight new features when they become available
    this.uiflowService.getDensity$(this.uiflowAutoDiscover)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkForNewFeatures();
      });
  }

  private checkForNewFeatures(): void {
    const area = this.uiflowAutoDiscover;
    const elements = this.elementRef.nativeElement.querySelectorAll(
      `[data-uiflow-area="${area}"][data-uiflow-visible="true"]`
    );

    elements.forEach((element: Element) => {
      const category = element.getAttribute('data-uiflow-category');
      const elementId = element.getAttribute('data-uiflow-id');
      const helpText = element.getAttribute('data-uiflow-help');

      if (category !== 'basic' && helpText && elementId) {
        this.uiflowService.flagAsNew(elementId, helpText, 8000);
      }
    });
  }

  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
