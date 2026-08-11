export interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'bendahara';
  last_login: string | null;
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
  deleted_at: string | null;
  is_deleted: boolean;
}

export type CreateUserInput = Pick<User, 'name' | 'username' | 'password' | 'role'> & {
  created_by?: number;
};

export type UpdateUserInput = Partial<Pick<User, 'name' | 'username' | 'password' | 'role'>> & {
  updated_by?: number;
};
