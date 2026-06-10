import { Profile } from '@/types/database';

export const DUMMY_USERS: Record<string, Profile> = {
  'admin@sap.edu': {
    id: 'admin-001',
    email: 'admin@sap.edu',
    full_name: 'Admin User',
    role: 'admin',
    department: 'Administration',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'faculty@sap.edu': {
    id: 'faculty-001',
    email: 'faculty@sap.edu',
    full_name: 'Dr. Faculty Member',
    role: 'faculty',
    department: 'Computer Science',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'student@sap.edu': {
    id: 'student-001',
    email: 'student@sap.edu',
    full_name: 'Student User',
    role: 'student',
    department: 'Computer Science',
    semester: 4,
    cgpa: 3.8,
    enrollment_number: 'SAP001',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const DUMMY_CREDENTIALS: Record<string, string> = {
  'admin@sap.edu': 'admin123',
  'faculty@sap.edu': 'faculty123',
  'student@sap.edu': 'student123',
};

export const AVAILABLE_USERS = Object.values(DUMMY_USERS);
