import { Pipe } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TextFormField } from '../../shared/form-field/form-field';
import { EditUserModal } from './edit-user-modal';
import { Users, type UserInfo } from '../users';

@Pipe({ name: 'transloco' })
class TranslationKeys {
  transform(key: string): string { return key; }
}

const user: UserInfo = {
  id: 'user-1', email: 'anna@example.com', displayName: 'Anna',
  preferredLanguage: 'en', isActive: true, lastLoginAt: null,
};

describe('EditUserModal submission', () => {
  const update = vi.fn();
  const close = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [EditUserModal],
      providers: [
        { provide: Users, useValue: { update } },
        { provide: NgbActiveModal, useValue: { close, dismiss: vi.fn() } },
      ],
    }).overrideComponent(EditUserModal, {
      remove: { imports: [TranslocoPipe] }, add: { imports: [TranslationKeys] },
    }).overrideComponent(TextFormField, {
      remove: { imports: [TranslocoPipe] }, add: { imports: [TranslationKeys] },
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(EditUserModal);
    fixture.componentInstance.initialize(user);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const submitForm = () => element.querySelector('form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    return { fixture, element, submitForm };
  }

  it('shows invalid email and language errors on submit without sending a request', async () => {
    const { fixture, element, submitForm } = setup();
    fixture.componentInstance.editUserModal.update(value => ({ ...value, email: '', preferredLanguage: '' }));
    fixture.detectChanges();
    submitForm();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.textContent).toContain('users.updateUser.errors.emailRequired');
    expect(element.textContent).toContain('users.updateUser.errors.languageRequired');
    expect(element.querySelector('#edit-email')?.classList.contains('is-invalid')).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });

  it('submits changed values once, blocks duplicates while pending and closes on success', async () => {
    const response = new Subject<{ id: string }>();
    update.mockReturnValue(response);
    const { fixture, element, submitForm } = setup();
    fixture.componentInstance.editUserModal.update(value => ({ ...value, displayName: 'Anna New' }));
    fixture.detectChanges();
    submitForm();
    submitForm();
    fixture.detectChanges();
    expect(update).toHaveBeenCalledExactlyOnceWith('user-1', { displayName: 'Anna New' });
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    expect(close).not.toHaveBeenCalled();
    response.next({ id: 'user-1' });
    response.complete();
    await fixture.whenStable();
    expect(close).toHaveBeenCalledOnce();
  });

  it('shows translated server errors and allows correcting and resubmitting', async () => {
    update.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 'AUTH_EMAIL_ALREADY_REGISTERED' } })));
    const { fixture, element, submitForm } = setup();
    fixture.componentInstance.editUserModal.update(value => ({ ...value, email: 'taken@example.com' }));
    fixture.detectChanges();
    submitForm();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('errors.AUTH_EMAIL_ALREADY_REGISTERED');
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
    expect(close).not.toHaveBeenCalled();
    fixture.componentInstance.editUserModal.update(value => ({ ...value, email: 'available@example.com' }));
    fixture.detectChanges();
    const response = new Subject<{ id: string }>();
    update.mockReturnValue(response);
    submitForm();
    expect(update).toHaveBeenCalledTimes(2);
    response.next({ id: user.id });
    response.complete();
    await fixture.whenStable();
    expect(close).toHaveBeenCalledOnce();
  });
});
