/**
 * DEPRECATED - This file contains mock implementations of Firebase utility functions
 * These are maintained for backward compatibility with existing code
 * Future versions should use direct API calls instead
 */

// Authentication utilities
export const getCurrentUser = () => {
  return null; // No current user in local storage auth
};

export const createUserWithEmail = async (email: string, password: string) => {
  console.warn('Firebase authentication is disabled. Using local storage instead.');
  return null;
};

export const signInWithEmail = async (email: string, password: string) => {
  console.warn('Firebase authentication is disabled. Using local storage instead.');
  return null;
};

export const signOut = async () => {
  console.warn('Firebase authentication is disabled. Using local storage instead.');
  return null;
};

// Firestore utilities
export const addDocument = async (collectionName: string, data: any) => {
  console.warn('Firebase Firestore is disabled. Data not saved to database.');
  return { id: `mock-${Date.now()}` };
};

export const getDocuments = async (collectionName: string) => {
  console.warn('Firebase Firestore is disabled. No data retrieved from database.');
  return [];
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  console.warn('Firebase Firestore is disabled. Data not updated in database.');
  return true;
};

export const deleteDocument = async (collectionName: string, id: string) => {
  console.warn('Firebase Firestore is disabled. Data not deleted from database.');
  return true;
};

export const getDocument = async (collectionName: string, id: string) => {
  console.warn('Firebase Firestore is disabled. No data retrieved from database.');
  return null;
};

export const queryDocuments = async (collectionName: string, field: string, operator: any, value: any) => {
  console.warn('Firebase Firestore is disabled. No data queried from database.');
  return [];
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  console.warn('Firebase Storage is disabled. File not uploaded.');
  return 'https://example.com/mock-url';
};
