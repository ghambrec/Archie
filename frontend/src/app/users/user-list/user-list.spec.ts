import { Pipe } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { Groups } from '../../groups/groups';
import { EditUserModal } from '../edit-user-modal/edit-user-modal';
import { UserInfo, Users } from '../users';
import { UserList } from './user-list';

// Translation setup is irrelevant to this button test.
@Pipe({
  name: 'transloco',
  standalone: true,
})
class FakeTranslocoPipe {
  transform(key: string): string {
    return key;
  }
}

describe('UserList edit button', () => {
  it('opens the edit modal with the clicked user', async () => {
    // Arrange: prepare a user and fake services.
    const user: UserInfo = {
      id: 'user-123',
      email: 'anna@example.com',
      displayName: 'Anna',
      preferredLanguage: 'en',
      isActive: true,
      lastLoginAt: null,
    };

    const initialize = vi.fn();
    const closed = new Subject<void>();

    const open = vi.fn().mockReturnValue({
      componentInstance: { initialize },
      closed,
    });

    await TestBed.configureTestingModule({
      imports: [UserList],
      providers: [
        { provide: NgbModal, useValue: { open } },
        {
          provide: Users,
          useValue: {
            users: {
              hasValue: () => true,
              value: () => [user],
              reload: vi.fn(),
            },
            getAvatarUrl: () => '/avatar',
          },
        },
        { provide: Groups, useValue: {} },
      ],
    })
      .overrideComponent(UserList, {
        remove: { imports: [TranslocoPipe] },
        add: { imports: [FakeTranslocoPipe] },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(UserList);
    fixture.detectChanges();

    // Act: click the actual button rendered by your template.
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Edit user"]'
    );

    expect(button).not.toBeNull();
    button!.click();

    // Assert: verify the correct modal and user.
    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith(
      EditUserModal,
      { centered: true }
    );
    expect(initialize).toHaveBeenCalledWith(user);
  });
});