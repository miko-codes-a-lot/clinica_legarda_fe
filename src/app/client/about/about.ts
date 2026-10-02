import { RouterLink } from '@angular/router';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [PageHeader, RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About {

}
