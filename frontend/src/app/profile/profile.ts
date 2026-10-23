import { Component, computed, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { Users } from '../users/users';
import { HttpClient } from '@angular/common/http';

interface ProfileUser {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: string;
  isActive?: boolean;
  isAdmin: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [NgbNavModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit, OnDestroy {
  private readonly users = inject(Users);
  private readonly http = inject(HttpClient);

  private avatarObjectUrl?: string;

  // Expliziter Return-Type: ProfileUser
  readonly profile = computed<ProfileUser>(() => {
    const u = this.users.currentUser();
    if (!u) {
      return {
        id: '',
        email: '',
        displayName: '',
        preferredLanguage: 'en',
        isActive: false,
        isAdmin: false,
      }
    }
    
    // CurrentUser hat kein isActive --> Default false
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      preferredLanguage: u.preferredLanguage,
      isActive: true, // oder false, falls backend es nicht liefert
      isAdmin: u.isAdmin,
    };
  });

  avatarUrl = `images/default-avatar.svg`;

  constructor() {
    // laeuft jedes mal wenn currentUser() sich aendert (auch initial)
    effect(() => {
      const user = this.users.currentUser();
      if (user) {
        console.log('[Profile] Effect triggered for user:', user.id);
        this.loadAvatar(user.id);
      } else {
        this.avatarUrl = 'images/default-avatar/svg';
      }
    });
  }

  ngOnInit(): void {
    if (!this.users.currentUser()) {
      this.users.getCurrentUser().subscribe({
        next: (user) => {
          this.users.currentUser.set(user);
          // this.loadAvatar(user.id);
        },
        error: () => this.avatarUrl = 'images/default-avatar.svg',
      });
    }
  }

  private loadAvatar(userId: string): void {
    const url = this.users.getAvatarUrl(userId);
    console.log('[Profile] Loading avatar:', url);

    this.http.get(url, { responseType: 'blob', withCredentials: true }).subscribe({
      next: (blob) => {
        console.log('[Profile] Blob:', blob.type, blob.size);
        this.avatarObjectUrl = URL.createObjectURL(blob);
        this.avatarUrl = this.avatarObjectUrl;
      },
      error: (err) => {
        console.error('[Profile] Avatar error:', err);
        this.avatarUrl = 'images/default-avatar.svg';
      },
    });
  }

  // private loadAvatar(userId: string): void {
  //   const url = this.users.getAvatarUrl(userId);
  //   console.log('[Profile] Loading avatar for:', userId, 'URL:', url);

  //   this.http.get(url, {
  //     responseType: 'blob',
  //     withCredentials: true,
  //   }).subscribe({
  //     next: (blob) => {
  //       console.log('[Profile] Avatar blob received:', blob.type, blob.size);
  //       this.avatarObjectUrl = URL.createObjectURL(blob);
  //       this.avatarUrl = this.avatarObjectUrl;
  //       console.log('[Profile] avatarUrl set to:', this.avatarUrl);
  //     },
  //     error: (err) => {
  //       console.error('[Profile] Avatar request failed:', err);
  //       this.avatarUrl = 'images/default-avatar.svg';
  //     },
  //   });
  // }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = 'images/default-avatar.svg';
  }

  ngOnDestroy(): void {
    this.avatarObjectUrl && URL.revokeObjectURL(this.avatarObjectUrl);
  }
} 