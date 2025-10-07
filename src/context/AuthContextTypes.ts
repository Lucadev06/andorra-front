export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (profile: UserProfile) => void;
  logout: () => void;
}