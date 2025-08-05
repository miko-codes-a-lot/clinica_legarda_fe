import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';


@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, MatSidenavModule, MatListModule, MatToolbarModule, MatIconModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {

}
