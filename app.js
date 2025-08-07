// Firebase configuration is already loaded in the head of index.html

// Initialize Firebase and global variables
let db,
  auth,
  storage,
  analytics,
  currentUser = null;

try {
  console.log("Setting up Firebase services");

  // Get the already initialized Firebase app
  const firebaseApp = firebase.app();

  // Initialize services
  db = firebase.firestore();
  auth = firebase.auth();
  storage = firebase.storage();
  analytics = firebase.analytics();

  console.log("Firebase services initialized successfully");

  // Check if Firestore Database exists
  db.collection("closetItems")
    .limit(1)
    .get()
    .then(() => {
      console.log("Firestore connection successful");
    })
    .catch((error) => {
      console.error("Error connecting to Firestore:", error);
      if (error.code === "permission-denied") {
        alert(
          "Firestore permission denied. Make sure you've set up Firestore security rules correctly."
        );
      } else if (error.code === "resource-exhausted") {
        alert("Firebase quota exceeded. Please try again later.");
      } else {
        alert("Error connecting to Firestore: " + error.message);
      }
    });

  // Check authentication state
  auth.onAuthStateChanged((user) => {
    console.log("Auth state changed, user:", user);
    currentUser = user;

    if (user) {
      // User is signed in
      console.log("User is signed in:", user.email);
      if (userEmailElement) {
        userEmailElement.textContent = user.email;
      }
      loadItems();
    } else {
      // No user is signed in, redirect to login page
      console.log("No user is signed in, redirecting to login");
      window.location.href = "login.html";
    }
  });
} catch (error) {
  console.error("Error initializing Firebase services:", error);
  alert("Error initializing Firebase services: " + error.message);
}

// DOM Elements
const addItemForm = document.getElementById("add-item-form");
const closetItemsContainer = document.getElementById("closet-items");
const filterCategory = document.getElementById("filter-category");
const userEmailElement = document.getElementById("user-email");
const logoutButton = document.getElementById("logout-button");

// Image related elements
const imageSourceRadios = document.querySelectorAll(
  'input[name="image-source"]'
);
const urlInputContainer = document.getElementById("url-input-container");
const fileInputContainer = document.getElementById("file-input-container");
const cameraInputContainer = document.getElementById("camera-input-container");
const imagePreviewContainer = document.getElementById(
  "image-preview-container"
);
const imagePreview = document.getElementById("image-preview");
const itemImageUrl = document.getElementById("item-image-url");
const itemImageFile = document.getElementById("item-image-file");
const cameraPreview = document.getElementById("camera-preview");
const cameraCanvas = document.getElementById("camera-canvas");
const capturedImage = document.getElementById("captured-image");
const startCameraBtn = document.getElementById("start-camera");
const capturePhotoBtn = document.getElementById("capture-photo");
const retakePhotoBtn = document.getElementById("retake-photo");

// Additional DOM Elements
const browseButton = document.getElementById("browse-button");
const fileNameDisplay = document.getElementById("file-name-display");
const switchCameraBtn = document.getElementById("switch-camera");
const cameraStatus = document.getElementById("camera-status");
const cameraPlaceholder = document.getElementById("camera-placeholder");

// Variables for camera and image handling
let imageBlob = null;
let imageSource = "url";
let stream = null;
let currentFacingMode = "environment"; // Start with back camera

// Set initial UI state for image source options
window.addEventListener("DOMContentLoaded", () => {
  // Highlight the URL option on page load (which is default)
  const urlOption = document.getElementById("url-option");
  if (urlOption) {
    urlOption.classList.add("bg-blue-50", "border-blue-500");
    urlOption.classList.remove("border-gray-300");
  }

  // If on mobile, pre-set the camera facing mode
  if (isMobileDevice()) {
    currentFacingMode = "environment"; // Use back camera by default on mobile
  }
});

// Logout functionality
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    auth
      .signOut()
      .then(() => {
        console.log("User signed out");
        window.location.href = "login.html";
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  });
}

// Handle image source change with improved UI
imageSourceRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    imageSource = radio.value;

    // Update selected option UI
    document
      .querySelectorAll("#url-option, #upload-option, #camera-option")
      .forEach((option) => {
        option.classList.remove("bg-blue-50", "border-blue-500");
        option.classList.add("border-gray-300");
      });

    // Highlight selected option
    const selectedOption = document.getElementById(`${imageSource}-option`);
    if (selectedOption) {
      selectedOption.classList.add("bg-blue-50", "border-blue-500");
      selectedOption.classList.remove("border-gray-300");
    }

    updateImageInputVisibility();

    // Automatically trigger actions based on the selected option
    if (imageSource === "upload") {
      // Small delay to ensure UI updates first
      setTimeout(() => {
        if (browseButton) browseButton.click();
      }, 100);
    } else if (imageSource === "camera") {
      // On mobile, start camera automatically
      if (isMobileDevice()) {
        setTimeout(() => {
          if (startCameraBtn && !startCameraBtn.classList.contains("hidden")) {
            startCamera();
          }
        }, 100);
      }
    }
  });
});

// Add click handlers for the option containers
document
  .querySelectorAll("#url-option, #upload-option, #camera-option")
  .forEach((option) => {
    option.addEventListener("click", () => {
      // Find the radio button inside this container
      const radio = option.querySelector('input[type="radio"]');
      if (radio && !radio.checked) {
        radio.checked = true;
        // Trigger the change event
        radio.dispatchEvent(new Event("change"));
      }
    });
  });

// Trigger file browser when the browse button is clicked
if (browseButton) {
  browseButton.addEventListener("click", () => {
    document.getElementById("item-image-file").click();
  });
}

// Update the image input visibility
function updateImageInputVisibility() {
  // First hide all containers
  urlInputContainer.classList.add("hidden");
  fileInputContainer.classList.add("hidden");
  cameraInputContainer.classList.add("hidden");
  imagePreviewContainer.classList.add("hidden");

  // Stop camera if switching away from camera
  if (imageSource !== "camera" && stream) {
    stopCamera();
  }

  // Now show the appropriate container
  if (imageSource === "url") {
    urlInputContainer.classList.remove("hidden");
    // Show preview if there's a URL
    if (itemImageUrl.value.trim()) {
      imagePreview.src = itemImageUrl.value.trim();
      imagePreviewContainer.classList.remove("hidden");
    }
  } else if (imageSource === "upload") {
    fileInputContainer.classList.remove("hidden");
    // Show preview if there's a file
    if (document.getElementById("item-image-file").files.length > 0) {
      imagePreviewContainer.classList.remove("hidden");
    }
  } else if (imageSource === "camera") {
    cameraInputContainer.classList.remove("hidden");
    // Show camera placeholder
    if (cameraPlaceholder) {
      cameraPlaceholder.classList.remove("hidden");
    }

    // Show preview if there's a captured image
    if (imageBlob) {
      imagePreviewContainer.classList.remove("hidden");
    }
  }
}

// Preview image from URL input
itemImageUrl.addEventListener("input", () => {
  const url = itemImageUrl.value.trim();
  if (url) {
    imagePreview.src = url;
    imagePreviewContainer.classList.remove("hidden");
    // Reset any previous blob
    imageBlob = null;
  } else {
    imagePreviewContainer.classList.add("hidden");
  }
});

// Preview image from file input
itemImageFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    // Display the file name
    fileNameDisplay.textContent = file.name;

    // Create a preview
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreview.src = event.target.result;
      imagePreviewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    fileNameDisplay.textContent = "";
    imagePreviewContainer.classList.add("hidden");
  }
});

// Camera related functionality
if (startCameraBtn) {
  startCameraBtn.addEventListener("click", startCamera);
}

if (capturePhotoBtn) {
  capturePhotoBtn.addEventListener("click", capturePhoto);
}

if (retakePhotoBtn) {
  retakePhotoBtn.addEventListener("click", retakePhoto);
}

if (switchCameraBtn) {
  switchCameraBtn.addEventListener("click", switchCamera);
}

// Switch between front and back cameras
function switchCamera() {
  // Toggle facing mode
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";

  // Stop current stream
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  // Restart with new facing mode
  startCamera();

  // Update status
  updateCameraStatus(
    `Switched to ${
      currentFacingMode === "environment" ? "back" : "front"
    } camera`
  );
}

// Update camera status message
function updateCameraStatus(message) {
  if (cameraStatus) {
    cameraStatus.textContent = message;
  }
  console.log("Camera status:", message);
}

// Helper function to detect mobile devices
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Start the camera with appropriate settings for the device
function startCamera() {
  updateCameraStatus("Starting camera...");

  // Hide placeholder when starting camera
  if (cameraPlaceholder) {
    cameraPlaceholder.classList.add("hidden");
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // For mobile devices, we prefer the back camera first
    const mobile = isMobileDevice();

    // Set default camera facing mode based on device type
    if (mobile && stream === null) {
      // On first access on mobile, use back camera by default
      currentFacingMode = "environment";
      updateCameraStatus("Requesting back camera (mobile device)...");
    }

    const constraints = {
      video: {
        facingMode: { ideal: currentFacingMode },
        width: { ideal: mobile ? 720 : 1280 },
        height: { ideal: mobile ? 1280 : 720 },
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(handleCameraStream)
      .catch((err) => {
        console.error("Failed to get camera:", err);
        updateCameraStatus(`Camera error: ${err.name}`);

        // Try with any camera as fallback
        updateCameraStatus("Trying any available camera...");

        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then(handleCameraStream)
          .catch((err) => {
            console.error("Failed to get any camera:", err);
            updateCameraStatus(`Camera error: ${err.message}`);
            alert(
              "Could not access your camera. Please check your permissions or try the Upload option instead."
            );

            // Show placeholder since camera failed
            if (cameraPlaceholder) {
              cameraPlaceholder.classList.remove("hidden");
            }
          });
      });
  } else {
    updateCameraStatus("Your browser doesn't support camera access");
    alert(
      "Your browser doesn't support camera access. Please try the Upload option instead."
    );
  }
}

// Handle successful camera stream
function handleCameraStream(mediaStream) {
  stream = mediaStream;

  // Hide placeholder once we have a stream
  if (cameraPlaceholder) {
    cameraPlaceholder.classList.add("hidden");
  }

  const videoTrack = mediaStream.getVideoTracks()[0];
  const settings = videoTrack.getSettings();

  // Log camera info for debugging
  console.log("Camera connected:", settings);
  updateCameraStatus(`Camera connected: ${videoTrack.label}`);

  // Set up video preview
  cameraPreview.srcObject = stream;
  cameraPreview.classList.remove("hidden");

  // Try to play the video
  cameraPreview
    .play()
    .then(() => {
      console.log("Camera preview started");
    })
    .catch((e) => {
      console.error("Error playing video:", e);
      updateCameraStatus(`Error starting preview: ${e.message}`);
    });

  // Show capture and switch buttons, hide start button
  startCameraBtn.classList.add("hidden");
  capturePhotoBtn.classList.remove("hidden");
  switchCameraBtn.classList.remove("hidden");

  // Make sure retake is hidden
  retakePhotoBtn.classList.add("hidden");
}

// Capture a photo from the camera with improved mobile support
function capturePhoto() {
  if (!cameraPreview.videoWidth) {
    console.error("Video not ready yet");
    updateCameraStatus("Video not ready, please wait");
    return;
  }

  updateCameraStatus("Capturing photo...");

  const context = cameraCanvas.getContext("2d");

  // Get video dimensions
  const videoWidth = cameraPreview.videoWidth;
  const videoHeight = cameraPreview.videoHeight;

  // Set canvas dimensions to match video
  cameraCanvas.width = videoWidth;
  cameraCanvas.height = videoHeight;

  // Handle the orientation correctly (especially for mobile)
  if (isMobileDevice() && window.innerHeight > window.innerWidth) {
    // Portrait mode on mobile
    if (currentFacingMode === "environment") {
      // Draw normally for back camera
      context.drawImage(cameraPreview, 0, 0, videoWidth, videoHeight);
    } else {
      // For front camera, mirror the image horizontally
      context.translate(videoWidth, 0);
      context.scale(-1, 1);
      context.drawImage(cameraPreview, 0, 0, videoWidth, videoHeight);
      context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    }
  } else {
    // Landscape or desktop
    if (currentFacingMode === "user") {
      // Mirror for front camera
      context.translate(videoWidth, 0);
      context.scale(-1, 1);
      context.drawImage(cameraPreview, 0, 0, videoWidth, videoHeight);
      context.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    } else {
      context.drawImage(cameraPreview, 0, 0, videoWidth, videoHeight);
    }
  }

  // Convert canvas to data URL and set image src
  capturedImage.src = cameraCanvas.toDataURL("image/jpeg", 0.85);
  capturedImage.classList.remove("hidden");

  // Show in preview
  imagePreview.src = capturedImage.src;
  imagePreviewContainer.classList.remove("hidden");

  // Convert canvas to blob for upload
  cameraCanvas.toBlob(
    (blob) => {
      imageBlob = blob;
      console.log("Captured photo blob created", blob.size, "bytes");
      updateCameraStatus(`Photo captured (${Math.round(blob.size / 1024)} KB)`);
    },
    "image/jpeg",
    0.85
  );

  // Hide video and capture button, show image and retake button
  cameraPreview.classList.add("hidden");
  capturePhotoBtn.classList.add("hidden");
  switchCameraBtn.classList.add("hidden");
  retakePhotoBtn.classList.remove("hidden");
}

// Retake the photo
function retakePhoto() {
  // Hide captured image, show video again
  capturedImage.classList.add("hidden");
  cameraPreview.classList.remove("hidden");

  // Show capture and switch buttons, hide retake button
  capturePhotoBtn.classList.remove("hidden");
  switchCameraBtn.classList.remove("hidden");
  retakePhotoBtn.classList.add("hidden");

  // Reset blob
  imageBlob = null;
  updateCameraStatus("Ready to capture");
}

// Stop the camera stream
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
      console.log("Stopped track:", track.kind, track.label);
    });
    stream = null;
    updateCameraStatus("Camera stopped");
  }

  // Reset camera UI
  cameraPreview.srcObject = null;
  cameraPreview.classList.add("hidden");
  capturedImage.classList.add("hidden");
  capturePhotoBtn.classList.add("hidden");
  switchCameraBtn.classList.add("hidden");
  retakePhotoBtn.classList.add("hidden");
  startCameraBtn.classList.remove("hidden");

  // Show placeholder
  if (cameraPlaceholder) {
    cameraPlaceholder.classList.remove("hidden");
  }
}

// Add item to Firebase
addItemForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // Check if Firebase is initialized
    if (!firebase || !db) {
      console.error("Firebase or Firestore is not initialized");
      alert("Firebase or Firestore is not initialized");
      return;
    }

    // Get current user
    const user = auth.currentUser;
    console.log("Current user on form submit:", user);

    if (!user) {
      console.error("No user signed in");
      alert("Error: No user signed in. Please log in again.");
      window.location.href = "login.html";
      return;
    }

    // Show loading state
    addItemForm.querySelector('button[type="submit"]').textContent =
      "Adding item...";
    addItemForm.querySelector('button[type="submit"]').disabled = true;

    await processFormSubmission(user);

    // Reset form and UI
    addItemForm.reset();
    imagePreviewContainer.classList.add("hidden");
    if (imageSource === "camera" && stream) {
      stopCamera();
    }
    imageSource = "url";
    updateImageInputVisibility();

    // Reset button
    addItemForm.querySelector('button[type="submit"]').textContent =
      "Add to Closet";
    addItemForm.querySelector('button[type="submit"]').disabled = false;
  } catch (error) {
    console.error("Error in form submission:", error);
    alert("Error in form submission: " + error.message);

    // Reset button
    addItemForm.querySelector('button[type="submit"]').textContent =
      "Add to Closet";
    addItemForm.querySelector('button[type="submit"]').disabled = false;
  }
});

// Process form submission with user
async function processFormSubmission(user) {
  const itemName = document.getElementById("item-name").value;
  const itemCategory = document.getElementById("item-category").value;
  const itemColor = document.getElementById("item-color").value;
  const itemSeason = document.getElementById("item-season").value;

  console.log("Processing form submission for image source:", imageSource);

  let imageUrl = "";

  if (imageSource === "url") {
    // Use the URL directly
    imageUrl = document.getElementById("item-image-url").value;
    if (!imageUrl) {
      console.log("No URL provided");
    }
  } else if (imageSource === "upload" || imageSource === "camera") {
    try {
      let fileToUpload;

      if (imageSource === "upload") {
        const fileInput = document.getElementById("item-image-file");
        fileToUpload = fileInput.files[0];
      } else {
        // For camera capture
        fileToUpload = imageBlob;
      }

      if (!fileToUpload) {
        alert("Please select an image file or take a photo first");
        throw new Error("No file selected");
      }

      // Create a FormData object
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("upload_preset", "ds7ru6tv");

      console.log("Attempting to upload to Cloudinary...");

      try {
        // Upload to Cloudinary
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/djjvjoxqn/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        console.log("Cloudinary response status:", response.status);

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Cloudinary error response:", errorData);
          throw new Error(
            `Upload failed: ${response.status} ${response.statusText}. ${errorData}`
          );
        }

        const data = await response.json();
        console.log("Cloudinary upload successful:", {
          publicId: data.public_id,
          url: data.secure_url,
          format: data.format,
          size: Math.round(data.bytes / 1024) + " KB",
          uploadedAt: new Date().toLocaleString(),
          dimensions: `${data.width}x${data.height}`,
          userId: user.uid,
        });
        imageUrl = data.secure_url;
        console.log("Image URL:", imageUrl);
      } catch (error) {
        console.error("Error during file upload:", error);
        alert("Failed to upload image: " + error.message);
        throw error;
      }
    } catch (error) {
      console.error("Error during file upload:", error);
      alert("Failed to upload image: " + error.message);
      throw error;
    }
  }

  console.log("Processing form submission with data:", {
    itemName,
    itemCategory,
    itemColor,
    itemSeason,
    imageUrl,
    userId: user.uid,
  });

  const item = {
    name: itemName,
    category: itemCategory,
    color: itemColor,
    season: itemSeason,
    imageUrl: imageUrl,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    userId: user.uid,
  };

  // Add to database
  try {
    const docRef = await db.collection("closetItems").add(item);
    console.log("Item added successfully with ID:", docRef.id);
    alert("Item added successfully!");

    // Refresh the items list
    loadItems();
  } catch (error) {
    console.error("Error adding item to database:", error);
    throw new Error(`Database error: ${error.message}`);
  }
}

// Load items from Firebase
function loadItems(category = "all") {
  // Get current user
  const user = auth.currentUser;

  if (!user) {
    console.log("No user signed in when loading items");
    closetItemsContainer.innerHTML =
      '<div class="col-span-full text-center py-8">Please sign in to view your items.</div>';
    return;
  }

  console.log("Loading items for user:", user.uid, "Category:", category);
  closetItemsContainer.innerHTML =
    '<div class="col-span-full text-center py-8">Loading items...</div>';

  let query = db
    .collection("closetItems")
    .where("userId", "==", user.uid)
    .orderBy("createdAt", "desc");

  if (category !== "all") {
    query = query.where("category", "==", category);
  }

  query
    .get()
    .then((snapshot) => {
      console.log("Items query result:", snapshot.size, "items found");
      closetItemsContainer.innerHTML = "";

      if (snapshot.empty) {
        closetItemsContainer.innerHTML =
          '<div class="col-span-full text-center py-8">No items found. Add some to your closet!</div>';
        return;
      }

      snapshot.forEach((doc) => {
        const item = doc.data();
        const itemId = doc.id;
        console.log("Adding item to UI:", itemId, item);
        addItemToUI(item, itemId);
      });
    })
    .catch((error) => {
      console.error("Error loading items:", error);
      closetItemsContainer.innerHTML =
        '<div class="col-span-full text-center py-8">Error loading items. Please try again.</div>';
    });
}

// Add item to UI
function addItemToUI(item, itemId) {
  const itemCard = document.createElement("div");
  itemCard.className = "item-card bg-white rounded-lg shadow overflow-hidden";
  itemCard.dataset.id = itemId;

  const defaultImage = "https://via.placeholder.com/300x200?text=No+Image";
  const imageUrl = item.imageUrl || defaultImage;

  itemCard.innerHTML = `
        <img src="${imageUrl}" alt="${
    item.name
  }" class="item-image w-full h-48 object-cover">
        <div class="p-4">
            <h3 class="font-semibold text-lg">${item.name}</h3>
            <div class="text-sm text-gray-600 mt-1">
                <p><span class="font-medium">Category:</span> ${capitalizeFirstLetter(
                  item.category
                )}</p>
                <p><span class="font-medium">Color:</span> ${capitalizeFirstLetter(
                  item.color
                )}</p>
                <p><span class="font-medium">Season:</span> ${capitalizeFirstLetter(
                  item.season
                )}</p>
            </div>
            <div class="mt-4 flex justify-end">
                <button class="delete-item text-red-500 hover:text-red-700" data-id="${itemId}">
                    Delete
                </button>
            </div>
        </div>
    `;

  closetItemsContainer.appendChild(itemCard);

  // Add delete listener
  itemCard.querySelector(".delete-item").addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    deleteItem(id);
  });
}

// Filter items by category
if (filterCategory) {
  filterCategory.addEventListener("change", () => {
    loadItems(filterCategory.value);
  });
}

// Delete item
function deleteItem(itemId) {
  if (confirm("Are you sure you want to delete this item?")) {
    db.collection("closetItems")
      .doc(itemId)
      .get()
      .then((doc) => {
        const item = doc.data();

        // Delete the document from Firestore
        return db
          .collection("closetItems")
          .doc(itemId)
          .delete()
          .then(() => {
            // If there's an image URL and it's from Storage (contains firebasestorage), delete it
            if (item.imageUrl && item.imageUrl.includes("firebasestorage")) {
              // Extract the storage path from the URL
              const storageRef = storage.refFromURL(item.imageUrl);
              return storageRef.delete();
            }
          });
      })
      .then(() => {
        console.log("Item deleted successfully");
        document.querySelector(`.item-card[data-id="${itemId}"]`).remove();

        // Check if there are any items left
        if (closetItemsContainer.children.length === 0) {
          closetItemsContainer.innerHTML =
            '<div class="col-span-full text-center py-8">No items found. Add some to your closet!</div>';
        }
      })
      .catch((error) => {
        console.error("Error deleting item:", error);
        alert("Error deleting item: " + error.message);
      });
  }
}

// Helper function
function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Test add item (DEBUG)
const testAddButton = document.getElementById("test-add-button");
if (testAddButton) {
  testAddButton.addEventListener("click", testAddItem);
}

function testAddItem() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user signed in");
      alert("Error: No user signed in. Please log in again.");
      return;
    }

    console.log("Test adding item for user:", user.uid);
    addTestItemToFirestore(user);
  } catch (error) {
    console.error("Error in test add:", error);
    alert("Error in test add: " + error.message);
  }
}

function addTestItemToFirestore(user) {
  const testItem = {
    name: "Test Item " + new Date().toLocaleTimeString(),
    category: "tops",
    color: "blue",
    season: "summer",
    imageUrl: "https://via.placeholder.com/300x200?text=Test+Item",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    userId: user.uid,
  };

  db.collection("closetItems")
    .add(testItem)
    .then(() => {
      console.log("Test item added successfully");
      alert("Test item added successfully!");
      loadItems(); // Refresh the list
    })
    .catch((error) => {
      console.error("Error adding test item:", error);
      alert("Error adding test item: " + error.message);
    });
}

// View all uploaded images for current user
async function viewUploadedImages() {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user signed in");
    return;
  }

  try {
    const snapshot = await db
      .collection("closetItems")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get();

    console.group("User Uploaded Images");
    console.log(`Total images: ${snapshot.size}`);

    snapshot.forEach((doc) => {
      const item = doc.data();
      console.log({
        itemId: doc.id,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
        uploadedAt: item.createdAt
          ? item.createdAt.toDate().toLocaleString()
          : "Unknown",
      });
    });
    console.groupEnd();
  } catch (error) {
    console.error("Error fetching images:", error);
  }
}

// Add button to HTML for viewing uploads
const userEmailContainer = document.getElementById("user-email");
if (userEmailContainer) {
  const viewUploadsButton = document.createElement("button");
  viewUploadsButton.textContent = "View Uploads";
  viewUploadsButton.className =
    "ml-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";
  viewUploadsButton.onclick = viewUploadedImages;
  userEmailContainer.parentNode.appendChild(viewUploadsButton);
}
