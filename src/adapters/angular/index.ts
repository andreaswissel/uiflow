/**
 * UIFlow Angular Adapter
 * Angular services, directives, and components for UIFlow integration
 */

import { 
  Injectable, 
  Directive, 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ElementRef, 
  OnInit, 
  OnDestroy, 
  Inject, 
  InjectionToken,
  TemplateRef,
  ViewContainerRef,
  ChangeDetectorRef,
  NgModule
} from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UIFlow } from '../../index.js';

// Injection token for UIFlow configuration
export const UIFLOW_CONFIG = new InjectionToken<any>('UIFlow Configuration');

/**
 * UIFlow Service - Core Angular service for UIFlow integration
 */
@Injectable({
  providedIn: 'root'
})
export class UIFlowService implements OnDestroy {
  private uiflow: UIFlow | null = null;
  private readonly isReady$ = new BehaviorSubject<boolean>(false);
  private readonly destroy$ = new Subject<void>();
  private readonly densitySubjects = new Map<string, BehaviorSubject<number>>();
  private readonly overrideSubjects = new Map<string, BehaviorSubject<boolean>>();

  constructor(@Inject(UIFLOW_CONFIG) private config: any = {}) {
    this.initialize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.uiflow) {
      this.uiflow.destroy();
    }
  }

  private async initialize(): Promise<void> {
    try {
      this.uiflow = new UIFlow();
      await this.uiflow.init(this.config);
      this.isReady$.next(true);
      this.setupEventListeners();
    } catch (error) {
      console.error('UIFlow initialization failed:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for density changes
    document.addEventListener('uiflow:density-changed', (event: any) => {
      const { area, density } = event.detail;
      this.getDensitySubject(area).next(density);
    });

    // Listen for adaptation events
    document.addEventListener('uiflow:adaptation', (event: any) => {
      const { area, newDensity } = event.detail;
      this.getDensitySubject(area).next(newDensity);
    });

    // Listen for override events
    document.addEventListener('uiflow:override-applied', (event: any) => {
      const { area } = event.detail;
      this.getOverrideSubject(area).next(true);
    });

    document.addEventListener('uiflow:override-cleared', (event: any) => {
      const { area } = event.detail;
      this.getOverrideSubject(area).next(false);
    });
  }

  private getDensitySubject(area: string): BehaviorSubject<number> {
    if (!this.densitySubjects.has(area)) {
      const initialDensity = this.uiflow ? this.uiflow.getDensityLevel(area) : 0.3;
      this.densitySubjects.set(area, new BehaviorSubject(initialDensity));
    }
    return this.densitySubjects.get(area)!;
  }

  private getOverrideSubject(area: string): BehaviorSubject<boolean> {
    if (!this.overrideSubjects.has(area)) {
      const hasOverride = this.uiflow ? this.uiflow.hasOverride(area) : false;
      this.overrideSubjects.set(area, new BehaviorSubject(hasOverride));
    }
    return this.overrideSubjects.get(area)!;
  }

  // Public API methods
  get isReady(): Observable<boolean> {
    return this.isReady$.asObservable();
  }

  get instance(): UIFlow | null {
    return this.uiflow;
  }

  categorize(element: Element, category: string, area: string = 'default', options: any = {}): void {
    if (this.uiflow) {
      this.uiflow.categorize(element, category, area, options);
    }
  }

  getDensityLevel(area: string = 'default'): number {
    return this.uiflow ? this.uiflow.getDensityLevel(area) : 0.3;
  }

  getDensity$(area: string = 'default'): Observable<number> {
    return this.getDensitySubject(area).asObservable();
  }

  setDensityLevel(level: number, area: string = 'default'): void {
    if (this.uiflow) {
      this.uiflow.setDensityLevel(level, area);
    }
  }

  hasOverride(area: string): boolean {
    return this.uiflow ? this.uiflow.hasOverride(area) : false;
  }

  hasOverride$(area: string): Observable<boolean> {
    return this.getOverrideSubject(area).asObservable();
  }

  shouldShowElement(category: string, area: string = 'default'): boolean {
    return this.uiflow ? this.uiflow.shouldShowElement(category, area) : true;
  }

  highlightElement(elementId: string, style: string = 'default', options: any = {}): void {
    if (this.uiflow) {
      this.uiflow.highlightElement(elementId, style, options);
    }
  }

  flagAsNew(elementId: string, helpText?: string, duration?: number): void {
    if (this.uiflow) {
      this.uiflow.flagAsNew(elementId, helpText, duration);
    }
  }

  simulateUsage(area: string, interactions: any[], days: number = 7): void {
    if (this.uiflow) {
      this.uiflow.simulateUsage(area, interactions, days);
    }
  }
}

/**
 * Directive for automatic element categorization
 */
@Directive({
  selector: '[uiflowElement]'
})
export class UIFlowElementDirective implements OnInit, OnDestroy {
  @Input() uiflowElement!: string; // category
  @Input() uiflowArea: string = 'default';
  @Input() uiflowHelpText?: string;
  @Input() uiflowIsNew: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private elementRef: ElementRef,
    private uiflowService: UIFlowService
  ) {}

  ngOnInit(): void {
    this.uiflowService.isReady
      .pipe(takeUntil(this.destroy$))
      .subscribe(ready => {
        if (ready) {
          this.categorizeElement();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private categorizeElement(): void {
    const options = {
      helpText: this.uiflowHelpText,
      isNew: this.uiflowIsNew
    };

    this.uiflowService.categorize(
      this.elementRef.nativeElement,
      this.uiflowElement,
      this.uiflowArea,
      options
    );
  }
}

/**
 * Structural directive for conditional rendering based on density
 */
@Directive({
  selector: '[uiflowIf]'
})
export class UIFlowIfDirective implements OnInit, OnDestroy {
  @Input() uiflowIf!: string; // category
  @Input() uiflowIfArea: string = 'default';

  private destroy$ = new Subject<void>();
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private uiflowService: UIFlowService
  ) {}

  ngOnInit(): void {
    this.uiflowService.isReady
      .pipe(takeUntil(this.destroy$))
      .subscribe(ready => {
        if (ready) {
          this.updateView();
          this.listenForDensityChanges();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private listenForDensityChanges(): void {
    this.uiflowService.getDensity$(this.uiflowIfArea)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });
  }

  private updateView(): void {
    const shouldShow = this.uiflowService.shouldShowElement(this.uiflowIf, this.uiflowIfArea);

    if (shouldShow && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!shouldShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Component for density level display
 */
@Component({
  selector: 'uiflow-density-indicator',
  template: `
    <div class="uiflow-density-indicator" [style]="indicatorStyle">
      <span>{{ area }}: </span>
      <span>{{ density | number:'1.0-0' }}%</span>
      <span *ngIf="showOverride && hasOverride" style="margin-left: 4px; opacity: 0.8">
        (override)
      </span>
    </div>
  `
})
export class UIFlowDensityIndicatorComponent implements OnInit, OnDestroy {
  @Input() area: string = 'default';
  @Input() showOverride: boolean = true;

  density: number = 30;
  hasOverride: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(private uiflowService: UIFlowService) {}

  ngOnInit(): void {
    this.uiflowService.getDensity$(this.area)
      .pipe(takeUntil(this.destroy$))
      .subscribe(density => {
        this.density = Math.round(density * 100);
      });

    this.uiflowService.hasOverride$(this.area)
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasOverride => {
        this.hasOverride = hasOverride;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get indicatorStyle(): any {
    return {
      padding: '4px 8px',
      backgroundColor: this.hasOverride ? '#fbbf24' : '#3b82f6',
      color: 'white',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold'
    };
  }
}

/**
 * Component for density control slider
 */
@Component({
  selector: 'uiflow-density-control',
  template: `
    <div class="uiflow-density-control">
      <label>{{ area }} Density: {{ density }}%</label>
      <input 
        type="range" 
        min="0" 
        max="100" 
        [value]="density"
        (input)="onDensityChange($event)"
        [disabled]="hasOverride"
      />
      <small *ngIf="hasOverride">Controlled remotely</small>
    </div>
  `,
  styles: [`
    .uiflow-density-control {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    input[type="range"] {
      width: 100%;
    }
    
    input[type="range"]:disabled {
      opacity: 0.5;
    }
    
    small {
      color: #6b7280;
      font-style: italic;
    }
  `]
})
export class UIFlowDensityControlComponent implements OnInit, OnDestroy {
  @Input() area: string = 'default';
  @Output() densityChange = new EventEmitter<number>();

  density: number = 30;
  hasOverride: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(private uiflowService: UIFlowService) {}

  ngOnInit(): void {
    this.uiflowService.getDensity$(this.area)
      .pipe(takeUntil(this.destroy$))
      .subscribe(density => {
        this.density = Math.round(density * 100);
      });

    this.uiflowService.hasOverride$(this.area)
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasOverride => {
        this.hasOverride = hasOverride;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDensityChange(event: any): void {
    const density = parseInt(event.target.value) / 100;
    this.uiflowService.setDensityLevel(density, this.area);
    this.densityChange.emit(density);
  }
}

/**
 * Angular Module for UIFlow
 */
@NgModule({
  declarations: [
    UIFlowElementDirective,
    UIFlowIfDirective,
    UIFlowDensityIndicatorComponent,
    UIFlowDensityControlComponent
  ],
  exports: [
    UIFlowElementDirective,
    UIFlowIfDirective,
    UIFlowDensityIndicatorComponent,
    UIFlowDensityControlComponent
  ],
  providers: [
    UIFlowService
  ]
})
export class UIFlowModule {
  static forRoot(config: any = {}) {
    return {
      ngModule: UIFlowModule,
      providers: [
        { provide: UIFLOW_CONFIG, useValue: config },
        UIFlowService
      ]
    };
  }
}

// Export Angular version for compatibility check
export const ANGULAR_ADAPTER_VERSION = '1.0.0';
