import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Pipe } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Users } from '../users';
import { RestoreUserModal } from '../restore-user-modal/restore-user-modal';

@Pipe({ name: 'transloco' })
class TranslationKeys {
  transform(key: string): string { return key; }
}

describe('RestoreUserModal', () => {
  let fixture: ComponentFixture<RestoreUserModal>;
  let http: HttpTestingController;
  let modal: { close: ReturnType<typeof vi.fn>; dismiss: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    modal = { close: vi.fn(), dismiss: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [RestoreUserModal],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), Users,
        { provide: NgbActiveModal, useValue: modal },
      ],
    }).overrideComponent(RestoreUserModal, {
      remove: { imports: [TranslocoPipe] },
      add: { imports: [TranslationKeys] },
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RestoreUserModal);
    fixture.componentInstance.selectedUser = {
      id: 'target-user', displayName: 'Anna', email: 'anna@example.com',
      preferredLanguage: 'en', isActive: false, lastLoginAt: null, deletedAt: '2026-10-20T10:00:00Z',
    };
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows the selected user and cancels without sending a restore request', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Anna');
    expect(element.textContent).toContain('anna@example.com');
    element.querySelector<HTMLButtonElement>('.modal-footer .btn-secondary')!.click();
    expect(modal.dismiss).toHaveBeenCalledOnce();
    expect(modal.close).not.toHaveBeenCalled();
    http.expectNone(request => request.method === 'PATCH');
  });

  it('restores only after confirmation, blocks duplicate submissions, and accepts HTTP 204', async () => {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    void fixture.componentInstance.confirmRestore();
    fixture.detectChanges();
    expect(element.querySelector<HTMLButtonElement>('.btn-primary')!.disabled).toBe(true);
    expect(element.querySelector<HTMLButtonElement>('.btn-close')!.disabled).toBe(true);
    const request = http.expectOne(r => r.method === 'PATCH' && r.url.endsWith('/users/target-user/restore'));
    expect(request.request.body).toEqual({});
    expect(request.request.withCredentials).toBe(true);
    expect(modal.close).not.toHaveBeenCalled();
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    expect(modal.close).toHaveBeenCalledWith('target-user');
  });

  it.each([
    [403, 'forbidden'], [404, 'notFound'], [409, 'conflict'], [500, 'general'],
  ])('keeps the modal open and displays the appropriate error for HTTP %s', async (status, error) => {
    const pending = fixture.componentInstance.confirmRestore();
    http.expectOne(r => r.method === 'PATCH').flush({}, { status, statusText: 'Error' });
    await pending;
    fixture.detectChanges();
    expect(modal.close).not.toHaveBeenCalled();
    expect(fixture.componentInstance.isRestoring()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent)
      .toContain(`users.restoreUser.errors.${error}`);
  });
});
