/**
 * DEPRECATED - Local storage authentication is now used instead of Firebase
 * This file remains for backward compatibility only and will be removed in future versions
 */

// Mock Firebase services for backward compatibility
export const auth = {
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Return a no-op unsubscribe function
    return () => {};
  },
  currentUser: null
};

export const db = {
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: false,
        data: () => null
      }),
      set: async () => {},
      update: async () => {}
    }),
    add: async () => ({
      id: 'mock-id'
    }),
    where: () => ({
      get: async () => ({
        docs: []
      })
    })
  })
};

export const storage = {
  ref: () => ({
    put: async () => {},
    getDownloadURL: async () => 'https://example.com/mock-url'
  })
};
