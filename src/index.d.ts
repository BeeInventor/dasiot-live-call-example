declare global {
  let __APP_VERSION__: string;
}

export type ProjectRole = "owner" | "admin" | "supervisor" | "viewer";

export interface Project {
  id: string;
  name: string;
  description?: string;
  imageURL: string | null;
  archived: boolean;
  center: [number, number];
  startDate: string;
  endDate: string;
  boundary: [[[number, number]]] | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string | undefined;
  orgId: string;
  cooperativeOrgs: Org[];
  userRole: ProjectRole | null;
  timezone: string;
}

export interface PagedResponse<T> {
  paging: {
    prevCursor: string | null;
    nextCursor: string | null;
  };
  metadata: {
    total: number;
  };
  data: Array<T>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  imageURL: string | null;
  enabled: boolean;
  passwordChangeRequired: boolean;
  createdAt: string;
  org: Organization;
}
