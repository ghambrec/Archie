import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Pipe, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Groups } from '../../groups/groups';
import { RestoreUserModal } from '../restore-user-modal/restore-user-modal';
import { Users, type UserInfo } from '../users';
import { UserList } from './user-list';
import { UserTable } from '../user-table/user-table';
import { DeletedUserList } from '../deleted-user-list/deleted-user-list';

@Pipe({ name: 'transloco' })
class TranslationKeys {
  transform(key: string): string { return key; }
}

const active: UserInfo = {
  id: 'active', email: 'active@example.com', displayName: 'Active User',
  preferredLanguage: 'en', isActive: true, lastLoginAt: null,
};
const deleted: UserInfo = {
  ...active, id: 'deleted', displayName: 'Deleted User', email: 'deleted@example.com',
  isActive: false, deletedAt: '2026-10-20T10:00:00Z',
};
const response = (data: UserInfo[]) => ({ data, page: 1, limit: 100, total: data.length, totalPages: 1 });

describe('Deleted users tab', () => {
  let fixture: ComponentFixture<UserList>;
  let http: HttpTestingController;
  let closed: Subject<string>;
  let open: ReturnType<typeof vi.fn>;
  let groupsReload: ReturnType<typeof vi.fn>;
  let modalInstance: { selectedUser?: UserInfo; isRestoring: ReturnType<typeof signal<boolean>> };

  beforeEach(async () => {
    closed = new Subject<string>();
    modalInstance = { isRestoring: signal(false) };
    open = vi.fn().mockReturnValue({ componentInstance: modalInstance, closed });
    groupsReload = vi.fn();
    await TestBed.configureTestingModule({
      imports: [UserList],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), Users,
        { provide: NgbModal, useValue: { open } },
        { provide: Groups, useValue: { groups: { reload: groupsReload } } },
      ],
    }).overrideComponent(UserList, {
      remove: { imports: [TranslocoPipe] }, add: { imports: [TranslationKeys] },
    }) .overrideComponent(UserTable, {
        remove: { imports: [TranslocoPipe] }, add: { imports: [TranslationKeys] },
      })
      .overrideComponent(DeletedUserList, {
        remove: { imports: [TranslocoPipe] }, add: { imports: [TranslationKeys] },
      })
      .compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Users).currentUser.set({
      id: 'admin', displayName: 'Admin', email: 'admin@example.com', preferredLanguage: 'en', isAdmin: true,
    });
    fixture = TestBed.createComponent(UserList);
    fixture.detectChanges();
    TestBed.tick();
    http.expectOne(r => r.method === 'GET' && r.url.endsWith('/users')).flush(response([active]));
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  function openDeletedTab() {
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.nav-tabs button');
    buttons[1].click();
    fixture.detectChanges();
    TestBed.tick();
    return http.expectOne(r => r.method === 'GET' && r.url.endsWith('/users/deleted'));
  }

  it('loads deleted accounts only when the tab is opened and replaces normal actions with Restore', async () => {
    http.expectNone(r => r.url.endsWith('/users/deleted'));
    const request = openDeletedTab();
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.params.get('limit')).toBe('100');
    request.flush(response([deleted]));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Deleted User');
    expect(element.querySelector('tbody')?.textContent).not.toContain('Active User');
    expect(element.querySelector('tbody')?.textContent).toContain('20.10.2026');
    expect(element.querySelector('button[aria-label="Edit user"]')).toBeNull();
    expect(element.querySelector('button[aria-label="users.userList.delete"]')).toBeNull();
    expect(element.querySelector('tbody img')).toBeNull();
    element.querySelector<HTMLButtonElement>('tbody button')!.click();
    expect(open).toHaveBeenCalledWith(RestoreUserModal, expect.objectContaining({ centered: true }));
    expect(modalInstance.selectedUser).toEqual(deleted);
  });

  it('shows a load failure instead of an empty list when the endpoint is unavailable and allows retry', async () => {
    openDeletedTab().flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('users.userList.deletedLoadError');
    expect(element.textContent).not.toContain('users.userList.deletedEmpty');
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    TestBed.tick();
    http.expectOne(r => r.url.endsWith('/users/deleted')).flush(response([]));
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.textContent).toContain('users.userList.deletedEmpty');
  });

  it('refreshes both account lists after restoration and removes the restored row from the deleted tab', async () => {
    openDeletedTab().flush(response([deleted]));
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('tbody button')!.click();
    closed.next(deleted.id);
    TestBed.tick();
    http.expectOne(r => r.url.endsWith('/users')).flush(response([active, { ...deleted, isActive: true, deletedAt: null }]));
    http.expectOne(r => r.url.endsWith('/users/deleted')).flush(response([]));
    await fixture.whenStable();
    expect(groupsReload).toHaveBeenCalledOnce();
    expect((fixture.nativeElement as HTMLElement).querySelector('tbody')?.textContent).not.toContain('Deleted User');
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.nav-tabs button')!.click();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('tbody')?.textContent).toContain('Deleted User');
  });
});
