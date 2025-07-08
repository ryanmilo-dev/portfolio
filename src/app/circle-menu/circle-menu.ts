import { Component, HostListener, ElementRef, ViewChild, OnInit, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, animate, transition } from '@angular/animations';
//import { ThreeDViewerComponent } from '../three-d-viewer/three-d-viewer'; // Adjust path as needed


type ButtonData = {
  label: string;
  angle: number; // Radians
};

type MenuItem = {
  label: string;
  content: {
    heading: string;
    body: string;
  },
  quote_mini: string,
  quote: string;
};

@Component({
  selector: 'circle-menu',
  standalone: true,
  //imports: [CommonModule, ThreeDViewerComponent],
  imports: [CommonModule],
  animations: [
    trigger('growFade', [
      transition(':enter', [
        style({ transform: 'scale(0.7)', opacity: 0 }),
        animate('600ms cubic-bezier(.5,1.5,.5,1)', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('400ms cubic-bezier(.7,0,.7,1)', style({ transform: 'scale(0.5)', opacity: 0 }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-50px)', opacity: 0 }),
        animate('350ms cubic-bezier(.3,1.3,.4,1)', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms', style({ transform: 'translateY(-50px)', opacity: 0 }))
      ])
    ]),
    trigger('growFadeContent', [
      transition(':enter', [
        style({ transform: 'scale(0.4)', opacity: 0 }),
        animate('550ms cubic-bezier(.5,1.5,.5,1)', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('400ms cubic-bezier(.7,0,.7,1)', style({ transform: 'scale(0.4)', opacity: 0 }))
      ])
    ])
  ],
  template: `
  <div class="circle-container"
      *ngIf="centerReady && menuState !== 'hidden'">
    <button
      *ngFor="let item of menuItems; let i = index"
      class="circle-btn"
      [ngStyle]="getButtonStyle(i)"
      [class.highlight]="hoverIndex === i"
      (mouseenter)="onHover(i)"
      (mouseleave)="onLeave()"
      (click)="onButtonClick(i)">
      {{ item.label }}
    </button>
  </div>

  <div #cContainer class="content-container" *ngIf="showContent() && selectedIndex !== null">
    <div *ngIf="contentState !== 'hidden'" class="content-box" [ngStyle]="getContentStyle()">
      <h2>{{ menuItems[selectedIndex!].content.heading }}</h2>
      <div class="content-text-container"><p class="content-paragraph-container" [innerHTML]="menuItems[selectedIndex!].content.body"></p></div>
      <button class="close-btn" (click)="onCloseContent()">
        <svg width="22px" height="22px" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.9998 8L6 14L12.9998 21" class="return-path"/>
          <path d="M6 14H28.9938C35.8768 14 41.7221 19.6204 41.9904 26.5C42.2739 33.7696 36.2671 40 28.9938 40H11.9984" class="return-path"/>
        </svg>
      </button>
    </div>
  </div>

  <div #qContainer class="quote-container" *ngIf="showContent() && selectedIndex !== null">
    <div *ngIf="contentState !== 'hidden'" class="quote-box" [ngStyle]="getContentStyle()">
      <h2 class="quote-mini">{{ menuItems[selectedIndex!].quote_mini }}</h2>
      <h2 class="quote">{{ menuItems[selectedIndex!].quote }}</h2>
    </div>
  </div>
  `,
  styleUrls: ['./circle-menu.scss']
})
export class CircleMenuComponent implements OnInit {
  buttonCount = 7;
  radius = 130;
  buttons: ButtonData[] = [];
  angles: number[] = [];
  rotation = 0; // Radians
  animating = true;
  hoverIndex: number|null = null;
  showButtons = signal(true);
  showContent = signal(false);
  selectedIndex: number|null = null;
  center = { x: 0, y: 0 };
  rotationSpeed = 0.005; // Radians/frame, default
  centerReady = false;
  buttonScale = 1.0;

  private _cContainer: ElementRef<HTMLDivElement> | null = null;

  @ViewChild('cContainer', { static: false })
  set cContainer(el: ElementRef<HTMLDivElement> | null) {
    this._cContainer = el;
  }
  private get cContainerEl(): HTMLDivElement | null {
    return this.cContainer && this.cContainer.nativeElement
      ? this.cContainer.nativeElement
      : null;
  }

  
  private _qContainer: ElementRef<HTMLDivElement> | null = null;

  @ViewChild('qContainer', { static: false })
  set qContainer(el: ElementRef<HTMLDivElement> | null) {
    this._qContainer = el;
  }
  private get qContainerEl(): HTMLDivElement | null {
    return this.qContainer && this.qContainer.nativeElement
      ? this.qContainer.nativeElement
      : null;
  }

  menuItems: MenuItem[] = [
    {
      label: 'myXP',
      content: {
        heading: 'Experience',
        body: `With a <strong>BSc in Electrical, Electronic & Computer Engineering</strong>, I’ve built a <strong>diverse career</strong> spanning firmware development, fullstack web engineering, industrial automation, business leadership, and technical mentorship.<br><br>
        <strong>I’ve led projects</strong> from renewable energy at CST SA (attending COP17 for wind tech innovation), to <strong>founding and running DIR Information Technology</strong>, through to <strong>architecting industrial IoT and AGV (Automated Guided Vehicle) systems</strong> at Control Technology and Battalion Technologies.<hr>
        My work <strong>consistently bridges the technical and human</strong>, focusing on <strong>robust solutions</strong> and delivering <strong>measurable business impact</strong>.<hr>
        <strong>Node.js • C • React.js • Vanilla JS • Django • Python • MicroPython • Arduino • PHP • MySQL • PostgreSQL • MS SQL Server • MQTT • CAN bus • WebSockets • APIs • Linux • AWS • WHM/cPanel • PLCs • VFDs • HMI • SCADA • OPC UA • Modbus • RS485 • RS232</strong>`
      },
      quote_mini: '"Jack of all trades..."',
      quote: '"Jack of all trades, master of none, but oftentimes better than a master of one."'
    },
    {
      label: 'bizDev',
      content: {
        heading: 'Business Development',
        body: `<strong>I founded and grew my own IT/web development business</strong>, led client relationships, managed pitches and proposals, and shaped market strategies for startups and established firms.<br><br>
        <strong>At Battalion Technologies</strong>, I crafted market entry, product, and service strategies, managed stakeholder engagements from trade shows to site visits, and helped define the company’s vision, core competencies, and growth trajectory.<hr>
        My <strong>approach balances technical innovation with practical business outcomes</strong>, always building strong, lasting client relationships.<hr>
        <strong>Client pitching • Market strategy • Product positioning • Proposal writing • Customer profiling • Startup operations • Trade shows</strong>`
      },
      quote_mini: '"The art of business..."',
      quote: '"The art of business is successfully bringing together different sectors of expertise into one living system of value that is, or will be, in demand."'
    },
    {
      label: 'design',
      content: {
        heading: 'Design',
        body: `<strong>User experience and design thinking</strong> are at the heart of my work.<br><br>
        <strong>I’ve designed interfaces</strong> for industrial SCADA/HMI, intuitive web applications, and <strong>complete product ecosystems</strong> - always prioritizing usability, safety, and maintainability.<hr>
        My skills span graphic design, branding, and content creation (with >50k TikTok followers), as well as AI-powered UX, video, and music production. I <strong>create engaging, accessible digital experiences</strong> that resonate with users and drive adoption.<hr>
        <strong>UI/UX • Adobe Photoshop • Illustrator • Krita • Video editing • After Effects • Premier Pro • Content creation • Branding • HMI design • Web graphics • Blender • Social media • Accessibility • OnShape</strong>`
      },
      quote_mini: '"The collective summary..."',
      quote: '"The collective summary of all relevant experiences expressed in one piece of beauty within confining parameters, that is functional and creates an emotive response."'
    },
    {
      label: 'frEnd',
      content: {
        heading: 'Frontend',
        body: `Proficient in <strong>building modern web interfaces</strong> with React, Vanilla JS, and WordPress, I’ve delivered customer-facing dashboards, real-time data visualizations, and robust admin panels.<br>
        <strong>I emphasize performance, responsiveness, and seamless integration</strong> with backends and APIs.<hr>
        <strong>My experience includes</strong> UX/UI design, dynamic charting, and creating custom interfaces for industrial control, monitoring, and reporting.<hr>
        <strong>React.js • Angular • JavaScript • TypeScript • HTML • SCSS/CSS • WordPress • Data visualization • REST APIs • WebSockets</strong>`
      },
      quote_mini: '"Start with a feasible idea..."',
      quote: '"Start with a feasible idea then grow and mould it, experiencing it as the user whilst being the developer, until it becomes what it was meant to be."'
    },
    {
      label: 'bkEnd',
      content: {
        heading: 'Backend',
        body: `<strong>Deep experience</strong> in Node.js, C, PHP, and microcontroller firmware (C, MicroPython, Arduino), with a strong focus on robust, scalable, and secure architectures.<br>
        <strong>I’ve developed everything</strong> from low-level device drivers and non-blocking CAN/MQTT communication layers to API-driven server applications and real-time socket bridges.<hr>
        My work <strong>enables seamless data flow, interoperability, and flexible integration</strong> - powering both industrial automation and web solutions.<hr>
        <strong>Node.js • C • PHP • Express.js • Python • MicroPython • Arduino • MQTT • CAN bus • WebSockets • REST APIs • Linux socket programming</strong>`
      },
      quote_mini: '"Understand the right system..."',
      quote: '"Understand the right system for both the immediate and long-term goals, choosing the right technology and methodolgy, then implement efficient, testable solutions."'
    },
    {
      label: 'data',
      content: {
        heading: 'Data',
        body: `<strong>Skilled in both real-time and batch data management</strong>: SQL (Postgres, MySQL, MS SQL Server), JSON-based systems, and high-speed telemetry for industrial IoT.<br>
        <strong>I’ve architected pipelines</strong> for data normalization, analytics, and automated reporting (PDF/Excel), always with a focus on <strong>operational insight and actionable metrics</strong>.<hr>
        I leverage data to optimize systems, drive business value, and inform strategic decision-making.<hr>
        <strong>MySQL • PostgreSQL • MS SQL Server • JSON • Data pipelines • Analytics • ETL • Automated reporting (PDF/Excel)</strong>`
      },
      quote_mini: '"Envision the data..."',
      quote: '"Envision the data requirements to build the right system early on. Choose efficient systems and structure that match the projected application, understanding the design trade-offs and how to mitigate fundamental restrictions."'
    },
    {
      label: 'server',
      content: {
        heading: 'Server',
        body: `<strong>Extensive server experience</strong>: from managing AWS deployments, web hosting (WHM, cPanel), and Linux system administration (Ubuntu, Amazon Linux), to configuring networking (MQTT brokers, Websockets, APIs) and email infrastructure.<hr>
        <strong>I design and maintain reliable, secure server environments</strong> that scale with business needs, ensuring high uptime and robust support for both web and industrial systems<hr>
        <strong>Ubuntu • Amazon Linux • AWS • WHM/cPanel • DNS • SSL • SMTP • MQTT brokers • Docker • CI/CD • Networking • Email hosting</strong>`
      },
      quote_mini: '"Tend your garden..."',
      quote: '"Tend your garden, automate manual processes and create updatable systems. Lean into well tested, solid infrastructure and practises that are well supported, but should there be trouble, remember, the buck stops with you."'
    },
  ];

  menuState: 'hidden' | 'entering' | 'visible' | 'exiting' = 'hidden';

  contentState: 'hidden' | 'entering' | 'visible' | 'exiting' = 'hidden';

  @Output() menuSelected = new EventEmitter<number>(); // send index, or any data you want
  @Output() menuDeselected = new EventEmitter<void>();

  ngOnInit() {
    this.setCenter();
    this.centerReady = true;
    const startRotation = Math.random() * Math.PI * 2;
    this.rotation = startRotation;
    this.buttonCount = this.menuItems.length;
    this.buttons = this.menuItems.map((item, i) => ({
      label: item.label,
      angle: (2 * Math.PI / this.buttonCount) * i
    }));
    this.animateRotation();
  }

  ngAfterViewInit() {
    // Wait a tick for the DOM to actually render, then begin entrance animation
    queueMicrotask(() => {
      this.menuState = 'entering';
      setTimeout(() => this.menuState = 'visible', 100);
    });
  }

  @HostListener('window:resize')
  setCenter() {
    this.center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
  }

  getButtonStyle(index: number) {
    const angle = this.buttons[index].angle + this.rotation;
    if (this.menuState === 'hidden') {
      return { display: 'none' };
    }
    if (this.menuState === 'entering') {
      // All at center, shrunken and faded in
      return {
        left: `${this.center.x}px`,
        top: `${this.center.y}px`,
        opacity: 0,
        transform: 'translate(-50%, -50%) scale(0.2)',
        zIndex: this.hoverIndex === index ? 2 : 1,
      };
    }
    if (this.menuState === 'visible') {
      // At proper circle position, fully visible
      const x = this.center.x + this.radius * Math.cos(angle);
      const y = this.center.y + this.radius * Math.sin(angle);
      return {
        left: `${x}px`,
        top: `${y}px`,
        opacity: 1,
        transform: `translate(-50%, -50%) scale(${index == this.hoverIndex ? this.buttonScale : '0.9'})`,
        zIndex: this.hoverIndex === index ? 2 : 1,
      };
    }
    if (this.menuState === 'exiting') {
      // Move to center, shrink and fade
      return {
        left: `${this.center.x}px`,
        top: `${this.center.y}px`,
        opacity: 0,
        transform: 'translate(-50%, -50%) scale(0.2)',
        zIndex: this.hoverIndex === index ? 2 : 1,
        pointerEvents: 'none',
      };
    }
    return {};
  }

  moveLeftInfoWindow() {
    //const el = this.cContainerEl;
    if (this._cContainer && this._cContainer.nativeElement){
      if(window.innerWidth > 768){
        this._cContainer.nativeElement.style.width = '50%';
      } else{
        this._cContainer.nativeElement.style.width = '100%';
      }
      //this._cContainer.nativeElement.style.background = 'linear-gradient(90deg, #6067b5, transparent)';
    }

    
    if (this._qContainer && this._qContainer.nativeElement){
      if(window.innerWidth > 768){
        this._qContainer.nativeElement.style.width = '50%';
        this._qContainer.nativeElement.style.right = '0';
      } else{
        this._qContainer.nativeElement.style.display = 'none';
      }
      //this._cContainer.nativeElement.style.background = 'linear-gradient(90deg, #6067b5, transparent)';
    }
  }
  moveCentreInfoWindow() {
    //const el = this.cContainerEl;
    if (this._cContainer && this._cContainer.nativeElement){
      //this._cContainer.nativeElement.style.width = '';
      this._cContainer.nativeElement.style.background = '';
    }

    
    if (this._qContainer && this._qContainer.nativeElement){
      this._qContainer.nativeElement.style.background = '';
    }
  }

  getContentStyle() {
    if (this.contentState === 'hidden') {
      return { display: 'none' };
    }
    if (this.menuState === 'entering') {
      // All at center, shrunken and faded in
      return {
        opacity: 1,
        transform: 'scale(0.2)'
        //zIndex: this.hoverIndex === index ? 2 : 1,
      };
    }
    if (this.contentState === 'visible') {
      // At proper circle position, fully visible
      return {
        opacity: 1,
        transform: `scale(1.0)`
        //zIndex: this.hoverIndex === index ? 2 : 1,
      };
    }
    if (this.contentState === 'exiting') {
      // Move to center, shrink and fade
      return {
        opacity: 0,
        transform: 'scale(0.2)',
        //zIndex: this.hoverIndex === index ? 2 : 1,
        pointerEvents: 'none',
      };
    }
    return {};
  }

  // Animation loop
  animateRotation() {
    if (this.showButtons() && this.animating) {
      this.rotation += this.rotationSpeed;
    }
    requestAnimationFrame(() => this.animateRotation());
  }

  // Mouse hover handlers
  onHover(i: number) {
    this.hoverIndex = i;
    this.animating = false;
    this.buttonScale = 1.2;
  }
  onLeave() {
    this.hoverIndex = null;
    this.animating = true;
    this.buttonScale = 1.0;
  }

  // Mousemove - affect speed by distance from center
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.showButtons()) return;
    const dx = event.clientX - this.center.x;
    const dy = event.clientY - this.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Map: centre = 0.03 (fast), edge = 0.005 (slow)
    let minR = this.radius + 60;
    this.rotationSpeed = Math.max(0.0, 0.01 * (1 - Math.min(dist, minR) / minR));
  }

  onButtonClick(i: number) {
    this.selectedIndex = i;
    this.menuState = 'exiting';
    this.contentState = 'entering';
    this.showContent.set(true);
    this.menuSelected.emit(i);
    
    setTimeout(() => {
      this.moveLeftInfoWindow();
      this.menuState = 'hidden'; // Remove from DOM after animation
      this.contentState = 'visible';
      //setTimeout(() => {
         // Show content component
      //}, 100); // animation duration
      this.animating = true;
    }, 400); // match CSS duration
  }

  onCloseContent() {
      this.moveCentreInfoWindow();
      this.menuDeselected.emit();
      this.contentState = 'exiting';
    setTimeout(() => {
      this.menuState = 'entering';
      this.contentState = 'hidden';
      this.showContent.set(false);
      setTimeout(() => {
        this.menuState = 'visible';
      }, 100); // animation duration
    }, 400); // match content hide animation
  }
}
