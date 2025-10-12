import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../_shared/service/auth-service';
import { UiStateService } from '../_shared/service/ui-state-service';
import { ClientNavComponent } from '../_shared/component/nav/client-nav.component';
import { Chatbot } from './chatbot/chatbot';
import { UserSimple } from '../_shared/model/user-simple';

@Component({
  selector: 'app-client',
  imports: [RouterLink, RouterOutlet, ClientNavComponent, Chatbot],
  templateUrl: './client.html',
  styleUrl: './client.css'
})
export class Client {
  user: UserSimple | null = null
  isLoading = false
  isChatOpen = false;

  navigations = [
    {
      label: 'Home',
      icon: 'home',
      link: '/app/home'
    },
    {
      label: 'Services',
      icon: 'medical_information',
      link: '/app/service'
    },
    {
      label: 'Appointment',
      icon: 'event',
      link: '/app/appointment'
    },
    {
      label: 'About Us',
      icon: 'info',
      link: '/app/about-us'
    },
    {
      label: 'Contact Us',
      icon: 'call',
      link: '/app/contact-us'
    },
    {
      label: 'FAQ',
      icon: 'help',
      link: '/app/faq'
    },
    // do we need to include this in the navigation?
    // {
    //   label: 'Registration',
    //   icon: 'event',
    //   link: '/app/registration'
    // },
    // {
    //   label: 'Logout',
    //   icon: 'logout',
    //   onClick: () => this.onClickLogout()
    // }
  ]

  constructor(
    private readonly uiStateService: UiStateService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe({
      next: (u) => {
        this.user = u
        if (u) {
          this.navigations.push()
        }
      }
    })

    this.uiStateService.isLoading$.subscribe({
      next: (i) => this.isLoading = i
    })
  }

  onClickLogout() {
    this.uiStateService.setLoading(true)

    this.authService.logout()
      .subscribe({
        next: () => this.router.navigate(['/app/login']),
        error: (err) => alert(`Something went wrong: ${err}`)
      })
      .add(() => this.uiStateService.setLoading(false))
  }
}
