import { ElementRef, ViewChild, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CircleMenuService } from '../circle-menu/circle-menu.service';
import { HttpClient } from '@angular/common/http';

type TerminalTheme = 'powershell' | 'gitbash' | 'ubuntu';

@Component({
  selector: 'app-terminal',
  imports: [CommonModule, FormsModule],
  templateUrl: './terminal.html',
  styleUrls: ['./terminal.scss']
})
export class TerminalComponent {
  history: string[] = ["Welcome to ryan's portfolio!", "Type 'help' for command info."];
  input = '';
  prompt = '$ ';
  theme: TerminalTheme = 'ubuntu';
  inChatMode = false;
  currentIndex = -1;
  menuArray: string[] = [
    "Experience",
    "Business Development",
    "Design",
    "Frontend",
    "Backend",
    "Data",
    "Server"
  ]
  menuItems: { [key: string]: number } = {
    myXP:0,
    myxp:0,
    bizDev:1,
    bizdev:1,
    design:2,
    frEnd:3,
    frend:3,
    bkEnd:4,
    bkend:4,
    data:5,
    server:6
  }
  commandHistory: string[] = [];
  historyIndex: number = -1;
  userIp: string | null = '';
  userCity: string | null = '';
  promptHeader: string | null = '';

  constructor(
    private http: HttpClient,
    private circleMenuService: CircleMenuService
  ) {}

  ngOnInit() {
    this.getUserIp();
  }
  
  historyContainerScrollHeightOld = 0;

  @ViewChild('historyContainer') private historyContainer!: ElementRef;

  getUserIp() {
    this.http.get<{ ip: string }>('https://api.ipify.org?format=json')
      .subscribe(data => {
        console.log(data);
        this.userIp = data.ip;
        console.log('User IP:', data.ip);
        fetch(`https://ipapi.co/${data.ip}/json/`)
          .then(res => res.json())
          .then(data => {
            console.log('IP info:', data);
            this.userCity = data.city;
            if(this.userCity){
              this.promptHeader = `${this.userCity.toLowerCase().replace(/ /g, '_')}@${this.userIp}`;
              this.prompt = `${this.userCity.toLowerCase().replace(/ /g, '_')}@${this.userIp}:~$`;
            }
            // data.org, data.city, data.country_name, etc.
          });
      });
  }

  triggerMenuChange(index: number) {
    this.circleMenuService.action$.next({ type: 'selectIndex', value: index });
  }
  triggerCloseContent() {
    this.circleMenuService.action$.next({ type: 'back', value: 0 });
  }

  ngAfterViewChecked() {
    this.scrollTerminalHistoryToBottom();
  }

  private scrollTerminalHistoryToBottom(): void {
    try {
      if(this.historyContainerScrollHeightOld !== this.historyContainer.nativeElement.scrollHeight){
        this.historyContainer.nativeElement.scrollTop = this.historyContainer.nativeElement.scrollHeight;
        this.historyContainerScrollHeightOld = this.historyContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  async handleCommand(cmd: string) {
    const now = Date.now();
    const dateTimeStr = now;
    //const dateTimeStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_`
    //  + `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    if (this.inChatMode) {
      // Call AI service
      this.history.push(this.prompt + ' ' + cmd);
      this.history.push(await this.askAI(cmd)); // pseudo
      if (cmd.trim() === 'exit') this.inChatMode = false;
      this.input = '';
      return;
    }

    this.history.push(this.prompt + ' ' + cmd);
    const [main, ...args] = cmd.split(' ');
    let command = main;
    switch (main) {
      case 'ryan':
        this.handleRyanCommand(args);
        break;
      case 'help':
       this.handleRyanCommand(args);
        break;
      case 'theme':
        this.setTheme(args[0]);
        break;
      case 'links':
        this.history.push(
          'Companies\n' +
          '<a class="linked" href="https://www.battaliontech.co.za/" target="_blank" rel="noopener noreferrer">↗Battalion Technologies</a>\n' +
          '<a class="linked" href="https://controltechnology.co.za/" target="_blank" rel="noopener noreferrer">↗Control Technology</a>\n' +
          '<a class="linked" href="https://iterateengineering.com/" target="_blank" rel="noopener noreferrer">↗Iterate Engineering</a>\n' +
          'Info\n' +
          '<a class="linked" href="https://www.linkedin.com/in/ryan-lobban-engineer/" target="_blank" rel="noopener noreferrer">↗LinkedIn</a>\n' +
          '<a class="linked" href="https://github.com/ryanmilo-dev" target="_blank" rel="noopener noreferrer">↗Github</a>\n' +
          'Personal Projects\n' +
          '<a class="linked" href="https://server.iterateengineering.com/" target="_blank" rel="noopener noreferrer">↗Neuron</a>\n' +
          '<a class="linked" href="https://server.iterateengineering.com/dashboard" target="_blank" rel="noopener noreferrer">↗KPI Dashboard Template</a>\n' +
          '<a class="linked" href="https://digitorumflex.com/" target="_blank" rel="noopener noreferrer">↗Digitorum Flex</a>\n'
        );
        break;
      case '>':
        if(this.currentIndex < 6){
          this.currentIndex++;
        } else {
          this.currentIndex = 0;
        }
        this.triggerMenuChange(this.currentIndex);
        this.history.push(`Loaded ${this.menuArray[this.currentIndex]} info.`);
        break;
      case '<':
        if(this.currentIndex > 0){
          this.currentIndex--;
        } else {
          this.currentIndex = 6;
        }
        this.triggerMenuChange(this.currentIndex);
        this.history.push(`Loaded ${this.menuArray[this.currentIndex]} info.`);
        break;
      case 'back':
        case 'b':
        this.triggerCloseContent();
        break;
      case 'privacy':
        this.history.push(
          `\n` +
          `   /$$$$$$$  /$$$$$$$  /$$$$$$ /$$    /$$  /$$$$$$   /$$$$$$  /$$     /$$\n` +
          `  | $$__  $$| $$__  $$|_  $$_/| $$   | $$ /$$__  $$ /$$__  $$|  $$   /$$/\n` +
          `  | $$  \\ $$| $$  \\ $$  | $$  | $$   | $$| $$  \\ $$| $$  \\__/ \\  $$ /$$/\n` +
          `  | $$$$$$$/| $$$$$$$/  | $$  |  $$ / $$/| $$$$$$$$| $$        \\  $$$$/\n` +
          `  | $$____/ | $$__  $$  | $$   \\  $$ $$/ | $$__  $$| $$         \\  $$/\n` +
          `  | $$      | $$  \\ $$  | $$    \\  $$$/  | $$  | $$| $$    $$    | $$\n` +
          `  | $$      | $$  | $$ /$$$$$$   \\  $/   | $$  | $$|  $$$$$$/    | $$\n` +
          `  |__/      |__/  |__/|______/    \\_/    |__/  |__/ \\______/     |__/\n` +
          `\n` +
          `PRIVACY POLICY\n` +
          `We collect your public IP address and its associated city only. No creeps here.`
        );
        break;
      default:
        if (command in this.menuItems){
          const selected = this.menuItems[command];
          this.triggerMenuChange(selected);
          this.currentIndex = selected;
          this.history.push(`Loaded ${this.menuArray[selected]} info.`);
        } else {
          this.history.push('Unknown command. Type `ryan help` for a list of commands.');
        }
    }
    if (main.trim()) {
      const trimmedMain = main.trim();
      if(this.commandHistory[this.commandHistory.length-1] !== trimmedMain) {
        this.commandHistory.push(main.trim());
      }
      this.historyIndex = this.commandHistory.length; // Reset index to "after last"
    }
    this.input = '';
  }

  
  historyUp() {
    if (this.commandHistory.length === 0) {
      this.input = '';
      return;
    }
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.input = this.commandHistory[this.historyIndex];
    } else if (this.historyIndex === 0) {
      // Already at oldest, do nothing or keep showing first
      this.input = this.commandHistory[0];
    }
  }

  historyDown() {
    if (this.commandHistory.length === 0) {
      this.input = '';
      return;
    }
    if (this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
      this.input = this.commandHistory[this.historyIndex];
    } else {
      this.historyIndex = this.commandHistory.length;
      this.input = ''; // Clear when you go past the most recent
    }
  }

  setTheme(theme: string) {
    if (['powershell', 'gitbash', 'ubuntu'].includes(theme)) {
      this.theme = (theme as TerminalTheme);
      this.history.push(`Theme changed to ${theme}.`);
      switch (theme) {
        case 'powershell': this.prompt = 'PS ' + this.promptHeader+'>'; break;
        case 'gitbash': this.prompt = this.promptHeader+' MINGW64 ~$'; break;
        case 'ubuntu': this.prompt = this.promptHeader+':~$'; break;
      }
    } else {
      this.history.push('Invalid theme. Available: powershell, gitbash, ubuntu.');
    }
  }

  handleRyanCommand(args: string[]) {
    if (!args.length || args[0] === 'help') {
      this.history.push(
        'Available commands:\n' +
        '- myxp, bizdev, design, frend, bkend,\n' +
        '  data, server, >, <, b\n' +
        /*
        '- projects\n' +
        '- experience\n' +
        '- skills\n' +
        '- qualifications\n' +
        '- interests\n' +
        '- chat\n' +*/
        '- theme [powershell|gitbash|ubuntu]\n' +
        '- links\n' +
        '- privacy'
      );
    } else {
      this.history.push(`Unknown ryan command: ${args.join(' ')}`);
    }
  }

  async askAI(question: string) {
    // Replace with actual call to OpenAI or similar
    return 'AI: [Demo answer about Ryan]';
  }
}
