import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { ConversationsService } from '../ai-chat/conversations.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar],
  providers: [ConversationsService],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {}
