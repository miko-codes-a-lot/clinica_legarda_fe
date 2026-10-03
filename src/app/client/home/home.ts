import { Icon } from '../../_shared/ui/icon/icon';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [Icon, PageHeader, CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  isChatOpen: boolean = false
}
