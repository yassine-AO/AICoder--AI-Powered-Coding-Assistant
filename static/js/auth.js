// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDAo3uz2FoP03YYkb_pbp5NEQP-7e-rC5A",
    authDomain: "codemind-ca225.firebaseapp.com",
    projectId: "codemind-ca225"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle Google Sign-In
document.getElementById('login').addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        // Sign in with Google popup
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Get the Firebase ID token
        const idToken = await user.getIdToken();

        // Extract user details from the Firebase user object
        const userData = {
            email: user.email,
            name: user.displayName?.split(' ')[0] || '', // First name (optional)
            surname: user.displayName?.split(' ')[1] || '', // Last name (optional)
            photo_url: user.photoURL || '' // Profile photo URL (optional)
        };

        // Send the token and user data to Flask backend for verification
        const response = await fetch('/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: idToken, ...userData })
        });

        const data = await response.json();
        if (data.success) {
           window.location.href = '/dashboard';
        } else {
            alert('Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Error during sign-in:', error);
        alert('Sign-in failed. Please try again.');
    }
});