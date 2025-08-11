// Firestore Security Rules — anon users can read and create threads/replies; only admin can update/delete
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      // Admin is a user signed in with email/password matching ADMIN_EMAIL
      return isSignedIn() && request.auth.token.email == "demienne.moth@gmail.com";
    }

    // Threads collection
    match /threads/{threadId} {
      allow read: if true; // public
      // Create allowed to ANY signed-in user (anonymous included)
      allow create: if isSignedIn();

      // Update/Delete only admin
      allow update, delete: if isAdmin();

      // Replies subcollection
      match /replies/{replyId} {
        allow read: if true;
        allow create: if isSignedIn();
        allow update, delete: if isAdmin();
      }
    }

    // User private subcollections (favorites/readlater/bookmarks) — only owner may write/read
    match /users/{userId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if isSignedIn() && request.auth.uid == userId;
      }
    }
  }
}
