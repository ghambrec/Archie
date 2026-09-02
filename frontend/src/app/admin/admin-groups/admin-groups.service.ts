import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  isSystem?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminGroupsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/groups`;

  getAll() {
    return this.http.get<Group[]>(this.base);
  }

  create(dto: CreateGroupDto) {
    return this.http.post<Group>(this.base, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}