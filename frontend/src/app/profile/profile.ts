import { Component, inject } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { Users } from '../users/users';
import { HttpClient } from '@angular/common/http';

interface UserProfile {
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
export class Profile {

  profile: UserProfile = {
    id: '',
    email: '',
    displayName: '',
    preferredLanguage: 'en',
    isActive: false,
    isAdmin: false,
  };

  private readonly users = inject(Users);
  private readonly http = inject(HttpClient);

  private avatarObjectUrl?: string;

  avatarUrl = `images/default-avatar.svg`;

  ngOnInit(): void {
  this.users.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Loaded user:', user);
        this.profile = user;
        this.loadAvatar();
      },
      error: (error) => {
        console.error('Could not load /users/me:', error);
        this.avatarUrl = `images/default-avatar.svg`;
      }
    });
  }

  private loadAvatar(): void {
    const url = this.users.getAvatarUrl(this.profile.id);
  
    console.log('Loading avatar:', url);

    this.http.get(url, {
      responseType: 'blob',
      withCredentials: true,
    }).subscribe({
      next: (avatarBlob) => {
        console.log(
          'Avatar loaded:',
          avatarBlob.type,
          avatarBlob.size,
        );

        this.avatarObjectUrl = URL.createObjectURL(avatarBlob);
        console.log('Blob URL:', this.avatarObjectUrl);

        this.avatarUrl = this.avatarObjectUrl;
        console.log('avatarUrl:', this.avatarUrl);
      },
      error: (error) => {
        console.error('Avatar request failed:', error);
        this.avatarUrl = `images/default-avatar.svg`;
      },
    });
  }    

  onAvatarError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'images/default-avatar.svg';
  }

  ngOnDestroy(): void {
    if (this.avatarObjectUrl) {
      URL.revokeObjectURL(this.avatarObjectUrl);
    }
  }
}