import { Pipe } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TextFormField } from '../../shared/form-field/form-field';
import { Users } from '../users';
import { CreateUserModal } from './create-user-modal';

@Pipe({ name: 'transloco' })
class TranslationKeys {
  transform(key: string): string { return key; }
}

describe('CreateUserModal shared fields', () => {
  const create = vi.fn();
  const close = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [CreateUserModal],
      providers: [
        { provide: Users, useValue: { create } },
        { provide: NgbActiveModal, useValue: { close, dismiss: vi.fn() } },
      ],
    }).overrideComponent(CreateUserModal, {
      remove: { imports: [TranslocoPipe] }, add: { imports: [TranslationKeys] },
    }).overrideComponent(TextFormField, {
      remove: { imports: [TranslocoPipe] }, add: { imports: [TranslationKeys] },
    }).compileComponents();
  });

  it('shows validation for all empty fields on submit with linked labels and errors', async () => {
    const fixture = TestBed.createComponent(CreateUserModal);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(create).not.toHaveBeenCalled();
    for (const [id, message] of [
      ['create-email', 'users.createUser.errors.emailRequired'],
      ['create-password', 'users.createUser.errors.passwordRequired'],
      ['create-displayName', 'users.createUser.errors.displayNameRequired'],
    ]) {
      expect(element.querySelector(`label[for="${id}"]`)).not.toBeNull();
      expect(element.querySelector(`#${id}`)?.getAttribute('aria-describedby')).toBe(`${id}-error`);
      expect(element.querySelector(`#${id}-error`)?.textContent).toContain(message);
    }
  });

  it('sends values entered through the shared inputs and displays server errors', async () => {
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 'AUTH_EMAIL_ALREADY_REGISTERED' } })));
    const fixture = TestBed.createComponent(CreateUserModal);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    for (const [id, value] of [
      ['create-email', 'anna@example.com'], ['create-password', 'Password123!'], ['create-displayName', 'Anna'],
    ]) {
      const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    fixture.detectChanges();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(create).toHaveBeenCalledExactlyOnceWith({ email: 'anna@example.com', password: 'Password123!', displayName: 'Anna' });
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('errors.AUTH_EMAIL_ALREADY_REGISTERED');
    expect(close).not.toHaveBeenCalled();
  });
});
