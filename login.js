// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBl3AgfG3r6mim4-iAVKsxBGQYEHurqOZI",
  authDomain: "closet-organiser.firebaseapp.com",
  projectId: "closet-organiser",
  storageBucket: "closet-organiser.appspot.com",
  messagingSenderId: "1056181704139",
  appId: "1:1056181704139:web:9076ecc0a51c9be91c524e",
  measurementId: "G-26SGF7D3MM",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// DOM Elements
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const loginError = document.getElementById("login-error");
const signupError = document.getElementById("signup-error");
const googleLoginBtn = document.getElementById("google-login");
const googleSignupBtn = document.getElementById("google-signup");
const loader = document.getElementById("loader");

// Check if already logged in
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in, redirect to main app
    console.log("User is already signed in:", user);
    window.location.href = "index.html";
  } else {
    console.log("No user signed in");
  }
});

// Tab switching
loginTab.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");

  // Update tab styles with Tailwind classes
  loginTab.classList.add("text-blue-500", "border-b-2", "border-blue-500");
  loginTab.classList.remove("text-gray-500");

  signupTab.classList.remove("text-blue-500", "border-b-2", "border-blue-500");
  signupTab.classList.add("text-gray-500");
});

signupTab.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");

  // Update tab styles with Tailwind classes
  loginTab.classList.remove("text-blue-500", "border-b-2", "border-blue-500");
  loginTab.classList.add("text-gray-500");

  signupTab.classList.add("text-blue-500", "border-b-2", "border-blue-500");
  signupTab.classList.remove("text-gray-500");
});

// Google authentication helper function
function signInWithGoogle(isSignup = false) {
  showLoader();

  console.log(`Google ${isSignup ? "sign-up" : "sign-in"} button clicked`);

  try {
    // Check if Firebase is properly initialized
    if (!firebase || !firebase.auth) {
      console.error("Firebase or Firebase Auth is not properly initialized");
      showError(
        "Firebase authentication is not properly initialized",
        isSignup
      );
      hideLoader();
      return;
    }

    // Create the Google auth provider
    const provider = new firebase.auth.GoogleAuthProvider();
    console.log("Google auth provider created");

    // Add scopes if needed
    provider.addScope("profile");
    provider.addScope("email");

    // Sign in with popup
    console.log("Starting Google sign-in popup");
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        console.log("Google sign-in successful", result.user);

        // If this is a signup, we might want to store additional user data
        if (isSignup) {
          // You could store additional user data in Firestore here
          console.log("New user signed up with Google");
        }

        // Redirect to main app
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Google sign-in error:", error);
        showError(`Google Sign-In Error: ${error.message}`, isSignup);
        hideLoader();
      });
  } catch (error) {
    console.error("Unexpected error during Google sign-in setup:", error);
    showError(`An unexpected error occurred: ${error.message}`, isSignup);
    hideLoader();
  }
}

// Login functionality
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showLoader();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  hideError(false);

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in successfully, redirect to main app
      console.log("User signed in successfully:", userCredential.user);
      window.location.href = "index.html";
    })
    .catch((error) => {
      // Handle errors
      console.error("Login error:", error);
      showError(error.message, false);
      hideLoader();
    });
});

// Signup functionality
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  showLoader();

  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById(
    "signup-confirm-password"
  ).value;

  hideError(true);

  // Check passwords match
  if (password !== confirmPassword) {
    showError("Passwords do not match", true);
    hideLoader();
    return;
  }

  // Create user
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Created account successfully
      console.log("User account created successfully:", userCredential.user);

      // You could store additional user data in Firestore here

      // Redirect to main app
      window.location.href = "index.html";
    })
    .catch((error) => {
      // Handle errors
      console.error("Signup error:", error);
      showError(error.message, true);
      hideLoader();
    });
});

// Google sign-in button listeners
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", () => signInWithGoogle(false));
}

if (googleSignupBtn) {
  googleSignupBtn.addEventListener("click", () => signInWithGoogle(true));
}

// Helper functions
function showLoader() {
  loader.classList.remove("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

function showError(message, isSignup) {
  const errorElement = isSignup ? signupError : loginError;
  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
}

function hideError(isSignup) {
  const errorElement = isSignup ? signupError : loginError;
  errorElement.classList.add("hidden");
}

// Global function to handle any lingering onclick references (legacy)
function googleButtonClicked() {
  console.log("Legacy googleButtonClicked function called");
  alert(
    "Using legacy login function. Please refresh the page if you see this message."
  );

  // Try to use the direct sign-in method
  signInWithGoogle(false);
}
