import { Login } from './../../../../pages/login/login';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss'],
})

export class Auth {
Loading = false;

}
