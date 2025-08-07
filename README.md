# Closet Organiser

A simple web application to help you organize your closet items. Built with HTML, Tailwind CSS, and Firebase.

## Features

- Add clothing items to your digital closet
- Categorize items by type, color, and season
- Filter items by category
- View all your closet items in a grid layout
- Delete items you no longer own

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd closet-organiser
```

### 2. Set up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Set up Firestore Database
   - Go to Firestore Database and click "Create Database"
   - Start in test mode
4. Set up Authentication
   - Go to Authentication and enable Anonymous authentication
5. Get your Firebase configuration
   - Go to Project Settings > General
   - Scroll down to "Your apps" section and click the web app icon (</>) if you haven't added a web app yet
   - Register your app with a nickname
   - Copy the firebaseConfig object

### 3. Update Firebase configuration

Edit the `app.js` file and replace the placeholder Firebase configuration with your own:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 4. Run the application

You can run the application using any local server. For example, using Python:

```bash
# If you have Python 3 installed
python -m http.server 8000

# If you have Python 2 installed
python -m SimpleHTTPServer 8000
```

Or using Node.js with the `http-server` package:

```bash
# Install http-server if you haven't already
npm install -g http-server

# Run the server
http-server
```

Then, open your browser and navigate to `http://localhost:8000`.

## Security Note

This application uses anonymous authentication for simplicity. In a production environment, you should implement proper user authentication and security rules for Firestore.

## Customization

You can customize the application by:

- Adding more categories or fields to the item form
- Changing the Tailwind CSS styling in the HTML
- Adding more features like editing items, creating outfits, etc.

## License

This project is open source and available under the [MIT License](LICENSE).
