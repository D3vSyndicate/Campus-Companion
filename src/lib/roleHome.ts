import type { UserRole } from '../context/AuthContext';

// The home screen for each kind of account. Everything that has to send someone "home" uses this, so
// signing in, opening the app and being sent to the wrong area all land in the same place.
export function homeRouteFor(role: UserRole | null | undefined): string {
  switch (role) {
    case 'coordinator':
      return '/(coordinator)';
    case 'hod':
      return '/(hod)';
    case 'mentor':
      return '/(mentor)';
    case 'admin':
      return '/(admin)';
    case 'student':
      return '/(student)';
    default:
      return '/login';
  }
}
