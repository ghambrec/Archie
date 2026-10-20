import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Pipe } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Users } from '../users';
import { DeleteUserModal } from './delete-user-modal';

@Pipe({ name: 'transloco' })
class TranslationKeys {
  transform(key: string): string { return key; }
}

describe('DeleteUserModal', () => {
  let fixture: ComponentFixture<DeleteUserModal>;
  let http: HttpTestingController;
  let modal: { close: ReturnType<typeof vi.fn>; dismiss: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    modal = { close: vi.fn(), dismiss: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [DeleteUserModal],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), Users,
        { provide: NgbActiveModal, useValue: modal },
      ],
    }).overrideComponent(DeleteUserModal, {
      remove: { imports: [TranslocoPipe] },
      add: { imports: [TranslationKeys] },
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DeleteUserModal);
    fixture.componentInstance.selectedUser = {
      id: 'target-user', displayName: 'Anna', email: 'anna@example.com',
      preferredLanguage: 'en', isActive: true, lastLoginAt: null,
    };
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows the selected user and cancels without sending a DELETE request', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Anna');
    expect(element.textContent).toContain('anna@example.com');
    element.querySelector<HTMLButtonElement>('.modal-footer .btn-secondary')!.click();
    expect(modal.dismiss).toHaveBeenCalledOnce();
    expect(modal.close).not.toHaveBeenCalled();
    http.expectNone(request => request.method === 'DELETE');
  });

  it('deletes only after confirmation, blocks duplicate submissions, and accepts HTTP 204', async () => {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.btn-danger')!.click();
    void fixture.componentInstance.confirmDelete();
    fixture.detectChanges();
    expect(element.querySelector<HTMLButtonElement>('.btn-danger')!.disabled).toBe(true);
    expect(element.querySelector<HTMLButtonElement>('.btn-close')!.disabled).toBe(true);
    const request = http.expectOne(r => r.method === 'DELETE' && r.url.endsWith('/users/target-user'));
    expect(request.request.withCredentials).toBe(true);
    expect(modal.close).not.toHaveBeenCalled();
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    expect(modal.close).toHaveBeenCalledWith('target-user');
  });

  it.each([
    [403, 'forbidden'], [404, 'notFound'], [409, 'conflict'], [500, 'general'],
  ])('keeps the modal open and displays the appropriate error for HTTP %s', async (status, error) => {
    const pending = fixture.componentInstance.confirmDelete();
    http.expectOne(r => r.method === 'DELETE').flush({}, { status, statusText: 'Error' });
    await pending;
    fixture.detectChanges();
    expect(modal.close).not.toHaveBeenCalled();
    expect(fixture.componentInstance.isDeleting()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent)
      .toContain(`users.deleteUser.errors.${error}`);
  });
});
