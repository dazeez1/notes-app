/**
 * Notes App - Frontend JavaScript
 * Handles authentication, notes management, and UI interactions
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
  API_BASE: "http://localhost:3000/api",
  ALERT_TIMEOUT: 5000,
  MAX_OTP_LENGTH: 6,
  MIN_PASSWORD_LENGTH: 6,
};

// Check if we're running from file:// protocol and show warning
if (window.location.protocol === "file:") {
  console.warn(
    "Running from file:// protocol. For full functionality, please serve the app from a web server."
  );
  // You could show a warning to the user here
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

const AppState = {
  authToken: localStorage.getItem("authToken"),
  currentUser: null,
  notes: [],
  pendingEmail: null,
  isLoading: false,
  editingNote: null,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show alert message to user
 * @param {string} elementId - ID of alert container
 * @param {string} message - Message to display
 * @param {string} type - Alert type (success, error, info)
 */
function showAlert(elementId, message, type) {
  const alertElement = document.getElementById(elementId);
  if (!alertElement) return;

  alertElement.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    alertElement.innerHTML = "";
  }, CONFIG.ALERT_TIMEOUT);
}

/**
 * Show form loading state
 * @param {string} formId - ID of form element
 * @param {boolean} isLoading - Whether to show loading state
 */
function setFormLoading(formId, isLoading) {
  const form = document.getElementById(formId);
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) return;

  if (isLoading) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<div class="spinner"></div> Loading...';
    submitButton.classList.add("loading");
  } else {
    submitButton.disabled = false;
    submitButton.innerHTML =
      submitButton.getAttribute("data-original-text") || "Submit";
    submitButton.classList.remove("loading");
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and message
 */
function validatePassword(password) {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
  }
  return { isValid: true, message: "Password is strong" };
}

/**
 * Show/hide loading spinner
 * @param {boolean} show - Whether to show loading
 */
function showLoading(show) {
  const loading = document.getElementById("notesLoading");
  if (!loading) return;

  if (show) {
    loading.classList.remove("hidden");
  } else {
    loading.classList.add("hidden");
  }
}

/**
 * Make API request with error handling
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(url, options = {}) {
  try {
    // Check if we're online
    if (!navigator.onLine) {
      throw new Error(
        "You are currently offline. Please check your internet connection."
      );
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(AppState.authToken && {
          Authorization: `Bearer ${AppState.authToken}`,
        }),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific HTTP status codes
      if (response.status === 401) {
        // Token expired or invalid, logout user
        logout();
        throw new Error("Session expired. Please login again.");
      } else if (response.status === 403) {
        throw new Error(
          "Access denied. You don't have permission to perform this action."
        );
      } else if (response.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment and try again."
        );
      } else if (response.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("API Request failed:", error);

    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }

    throw error;
  }
}

// ============================================================================
// UI MANAGEMENT
// ============================================================================

/**
 * Show login section
 */
function showLogin() {
  hideAllSections();
  document.getElementById("loginSection").classList.remove("hidden");
}

/**
 * Show signup section
 */
function showSignup() {
  hideAllSections();
  document.getElementById("signupSection").classList.remove("hidden");
}

/**
 * Show OTP verification section
 * @param {string} email - Email to verify
 */
function showOtpVerification(email) {
  hideAllSections();
  const otpSection = document.getElementById("otpSection");
  otpSection.classList.remove("hidden");
  document.getElementById("otpEmail").textContent = email;
  document.getElementById("otpCode").value = "";
}

/**
 * Show main app section
 */
function showApp() {
  hideAllSections();
  document.getElementById("appSection").classList.remove("hidden");
}

/**
 * Hide all sections
 */
function hideAllSections() {
  const sections = [
    "loginSection",
    "signupSection",
    "otpSection",
    "appSection",
  ];
  sections.forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.classList.add("hidden");
  });
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function login(email, password) {
  // Validate inputs
  if (!email || !password) {
    showAlert("loginAlert", "Please fill in all fields.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("loginAlert", "Please enter a valid email address.", "error");
    return;
  }

  setFormLoading("loginForm", true);

  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        emailAddress: email,
        password: password,
      }),
    });

    if (data.success) {
      AppState.authToken = data.data.authToken;
      AppState.currentUser = data.data.user;
      localStorage.setItem("authToken", AppState.authToken);

      showAlert("loginAlert", "Login successful!", "success");
      showApp();
      loadUserProfile();
      loadNotes();
    }
  } catch (error) {
    showAlert(
      "loginAlert",
      error.message || "Login failed. Please try again.",
      "error"
    );
  } finally {
    setFormLoading("loginForm", false);
  }
}

/**
 * Sign up new user
 * @param {string} fullName - User's full name
 * @param {string} email - User's email
 * @param {string} phone - User's phone number
 * @param {string} password - User's password
 */
async function signup(fullName, email, phone, password) {
  // Validate inputs
  if (!fullName || !email || !phone || !password) {
    showAlert("signupAlert", "Please fill in all fields.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("signupAlert", "Please enter a valid email address.", "error");
    return;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    showAlert("signupAlert", passwordValidation.message, "error");
    return;
  }

  if (fullName.trim().length < 2) {
    showAlert(
      "signupAlert",
      "Full name must be at least 2 characters long.",
      "error"
    );
    return;
  }

  setFormLoading("signupForm", true);

  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/auth/signup`, {
      method: "POST",
      body: JSON.stringify({
        fullName: fullName.trim(),
        emailAddress: email.toLowerCase().trim(),
        phoneNumber: phone.trim(),
        password: password,
      }),
    });

    if (data.success) {
      showAlert(
        "signupAlert",
        "Account created successfully! Please check your email for the verification code.",
        "success"
      );
      AppState.pendingEmail = email.toLowerCase().trim();
      showOtpVerification(email.toLowerCase().trim());
    }
  } catch (error) {
    showAlert(
      "signupAlert",
      error.message || "Signup failed. Please try again.",
      "error"
    );
  } finally {
    setFormLoading("signupForm", false);
  }
}

/**
 * Verify OTP code for email verification
 * @param {string} email - User's email
 * @param {string} otpCode - OTP verification code
 */
async function verifyOtp(email, otpCode) {
  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/auth/verify-otp`, {
      method: "POST",
      body: JSON.stringify({
        emailAddress: email,
        otpCode: otpCode,
      }),
    });

    if (data.success) {
      AppState.authToken = data.data.authToken;
      AppState.currentUser = data.data.user;
      localStorage.setItem("authToken", AppState.authToken);

      showAlert(
        "otpAlert",
        "Email verified successfully! Welcome to Notes App!",
        "success"
      );
      showApp();
      loadUserProfile();
      loadNotes();
    }
  } catch (error) {
    showAlert(
      "otpAlert",
      error.message || "Verification failed. Please try again.",
      "error"
    );
  }
}

/**
 * Resend OTP verification code
 */
async function resendOtp() {
  if (!AppState.pendingEmail) {
    showAlert(
      "otpAlert",
      "No pending email found. Please sign up again.",
      "error"
    );
    return;
  }

  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/auth/resend-otp`, {
      method: "POST",
      body: JSON.stringify({
        emailAddress: AppState.pendingEmail,
      }),
    });

    if (data.success) {
      showAlert(
        "otpAlert",
        "Verification code resent successfully!",
        "success"
      );
    }
  } catch (error) {
    showAlert(
      "otpAlert",
      error.message || "Failed to resend code. Please try again.",
      "error"
    );
  }
}

/**
 * Load user profile information
 */
async function loadUserProfile() {
  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/auth/me`);

    if (data.success) {
      AppState.currentUser = data.data.user;
      document.getElementById("userName").textContent =
        AppState.currentUser.fullName;
      document.getElementById("userEmail").textContent =
        AppState.currentUser.emailAddress;
    }
  } catch (error) {
    console.error("Failed to load user profile:", error);
  }
}

/**
 * Logout user and clear session
 */
function logout() {
  AppState.authToken = null;
  AppState.currentUser = null;
  AppState.notes = [];
  AppState.pendingEmail = null;
  localStorage.removeItem("authToken");
  showLogin();
}

// ============================================================================
// NOTES MANAGEMENT
// ============================================================================

/**
 * Create a new note
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @param {string} tags - Comma-separated tags
 */
async function createNote(title, content, tags) {
  // Validate inputs
  if (!title || !content) {
    showAlert("noteAlert", "Please fill in both title and content.", "error");
    return;
  }

  if (title.trim().length < 1) {
    showAlert("noteAlert", "Note title cannot be empty.", "error");
    return;
  }

  if (content.trim().length < 1) {
    showAlert("noteAlert", "Note content cannot be empty.", "error");
    return;
  }

  setFormLoading("noteForm", true);

  try {
    const noteTags = tags
      ? tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    const data = await apiRequest(`${CONFIG.API_BASE}/notes`, {
      method: "POST",
      body: JSON.stringify({
        noteTitle: title.trim(),
        noteContent: content.trim(),
        noteTags: noteTags,
      }),
    });

    if (data.success) {
      showAlert("noteAlert", "Note created successfully!", "success");
      document.getElementById("noteForm").reset();
      loadNotes();
      loadStats();
    }
  } catch (error) {
    showAlert(
      "noteAlert",
      error.message || "Failed to create note. Please try again.",
      "error"
    );
  } finally {
    setFormLoading("noteForm", false);
  }
}

/**
 * Load all notes for the current user
 */
async function loadNotes() {
  showLoading(true);
  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/notes`);

    if (data.success) {
      AppState.notes = data.data.notes;
      displayNotes(AppState.notes);
      updateTagFilter(AppState.notes);
    }
  } catch (error) {
    showAlert(
      "noteAlert",
      error.message || "Failed to load notes. Please try again.",
      "error"
    );
  } finally {
    showLoading(false);
  }
}

/**
 * Load note statistics
 */
async function loadStats() {
  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/notes/stats`);

    if (data.success) {
      const stats = data.data.statistics;
      document.getElementById("totalNotes").textContent = stats.totalNotes || 0;
      document.getElementById("pinnedNotes").textContent =
        stats.pinnedNotes || 0;
    }
  } catch (error) {
    console.error("Failed to load stats:", error);
  }
}

/**
 * Update an existing note
 * @param {string} noteId - Note ID
 * @param {Object} updates - Updates to apply
 */
async function updateNote(noteId, updates) {
  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    if (data.success) {
      showAlert("noteAlert", "Note updated successfully!", "success");
      loadNotes();
      loadStats();
    }
  } catch (error) {
    showAlert(
      "noteAlert",
      error.message || "Failed to update note. Please try again.",
      "error"
    );
  }
}

/**
 * Delete a note
 * @param {string} noteId - Note ID to delete
 */
async function deleteNote(noteId) {
  // Create a more user-friendly confirmation dialog
  const note = AppState.notes.find((n) => n._id === noteId);
  const noteTitle = note ? note.noteTitle : "this note";

  const confirmed = confirm(
    `Are you sure you want to delete "${noteTitle}"?\n\nThis action cannot be undone.`
  );
  if (!confirmed) return;

  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/notes/${noteId}`, {
      method: "DELETE",
    });

    if (data.success) {
      showAlert("noteAlert", "Note deleted successfully!", "success");
      loadNotes();
      loadStats();
    }
  } catch (error) {
    showAlert(
      "noteAlert",
      error.message || "Failed to delete note. Please try again.",
      "error"
    );
  }
}

/**
 * Toggle pin status of a note
 * @param {string} noteId - Note ID
 */
async function togglePin(noteId) {
  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/notes/${noteId}/pin`, {
      method: "PATCH",
    });

    if (data.success) {
      loadNotes();
      loadStats();
    }
  } catch (error) {
    showAlert(
      "noteAlert",
      error.message || "Failed to toggle pin. Please try again.",
      "error"
    );
  }
}

/**
 * Get a note by ID
 * @param {string} noteId - Note ID
 * @returns {Object|null} Note object or null if not found
 */
async function getNoteById(noteId) {
  try {
    const data = await apiRequest(`${CONFIG.API_BASE}/notes/${noteId}`);

    if (data.success) {
      return data.data.note;
    }
    return null;
  } catch (error) {
    console.error("Failed to get note:", error);
    return null;
  }
}

/**
 * Open edit modal for a note
 * @param {string} noteId - Note ID to edit
 */
async function editNote(noteId) {
  try {
    const note = await getNoteById(noteId);
    if (!note) {
      showAlert("noteAlert", "Note not found.", "error");
      return;
    }

    AppState.editingNote = note;

    // Populate the edit form
    document.getElementById("editTitle").value = note.noteTitle;
    document.getElementById("editContent").value = note.noteContent;
    document.getElementById("editTags").value = note.noteTags
      ? note.noteTags.join(", ")
      : "";

    // Show the modal
    document.getElementById("editModal").classList.remove("hidden");
    document.getElementById("editTitle").focus();
  } catch (error) {
    showAlert("noteAlert", "Failed to load note for editing.", "error");
  }
}

/**
 * Close the edit modal
 */
function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  AppState.editingNote = null;
  document.getElementById("editForm").reset();
  document.getElementById("editAlert").innerHTML = "";
}

/**
 * Update a note via the edit modal
 * @param {string} noteId - Note ID
 * @param {string} title - Updated title
 * @param {string} content - Updated content
 * @param {string} tags - Updated tags (comma-separated)
 */
async function updateNoteFromModal(noteId, title, content, tags) {
  // Validate inputs
  if (!title || !content) {
    showAlert("editAlert", "Please fill in both title and content.", "error");
    return;
  }

  if (title.trim().length < 1) {
    showAlert("editAlert", "Note title cannot be empty.", "error");
    return;
  }

  if (content.trim().length < 1) {
    showAlert("editAlert", "Note content cannot be empty.", "error");
    return;
  }

  setFormLoading("editForm", true);

  try {
    const noteTags = tags
      ? tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    const data = await apiRequest(`${CONFIG.API_BASE}/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify({
        noteTitle: title.trim(),
        noteContent: content.trim(),
        noteTags: noteTags,
      }),
    });

    if (data.success) {
      showAlert("editAlert", "Note updated successfully!", "success");
      closeEditModal();
      loadNotes();
      loadStats();
    }
  } catch (error) {
    showAlert(
      "editAlert",
      error.message || "Failed to update note. Please try again.",
      "error"
    );
  } finally {
    setFormLoading("editForm", false);
  }
}

/**
 * Search notes by query
 */
async function searchNotes() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) {
    loadNotes();
    return;
  }

  showLoading(true);
  try {
    const data = await apiRequest(
      `${CONFIG.API_BASE}/notes/search?q=${encodeURIComponent(query)}`
    );

    if (data.success) {
      AppState.notes = data.data.notes;
      displayNotes(AppState.notes);
    }
  } catch (error) {
    showAlert(
      "noteAlert",
      error.message || "Search failed. Please try again.",
      "error"
    );
  } finally {
    showLoading(false);
  }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

/**
 * Display notes in the UI
 * @param {Array} notesToDisplay - Array of notes to display
 */
function displayNotes(notesToDisplay) {
  const container = document.getElementById("notesContainer");
  if (!container) return;

  if (notesToDisplay.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #666; grid-column: 1 / -1;">No notes found. Create your first note above!</p>';
    return;
  }

  container.innerHTML = notesToDisplay
    .map((note) => createNoteCard(note))
    .join("");
}

/**
 * Create HTML for a single note card
 * @param {Object} note - Note object
 * @returns {string} HTML string
 */
function createNoteCard(note) {
  const pinnedClass = note.isNotePinned ? "pinned" : "";
  const pinIcon = note.isNotePinned ? "📌 " : "";

  return `
    <div class="note-card ${pinnedClass}">
      <div class="note-title">${pinIcon}${escapeHtml(note.noteTitle)}</div>
      <div class="note-content">${escapeHtml(note.noteContent)}</div>
      ${createTagsHtml(note.noteTags)}
      <div class="note-meta">
        <span>Created: ${new Date(
          note.noteCreatedAt
        ).toLocaleDateString()}</span>
        <span>Updated: ${new Date(
          note.noteUpdatedAt
        ).toLocaleDateString()}</span>
      </div>
      <div class="note-actions">
        ${createActionButtons(note)}
      </div>
    </div>
  `;
}

/**
 * Create HTML for note tags
 * @param {Array} tags - Array of tags
 * @returns {string} HTML string
 */
function createTagsHtml(tags) {
  if (!tags || tags.length === 0) return "";

  return `
    <div class="note-tags">
      ${tags
        .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join("")}
    </div>
  `;
}

/**
 * Create action buttons for a note
 * @param {Object} note - Note object
 * @returns {string} HTML string
 */
function createActionButtons(note) {
  const editButton = createButton(
    "✏️ Edit",
    `editNote('${note._id}')`,
    "btn-secondary"
  );

  const pinButton = createButton(
    note.isNotePinned ? "📌 Unpin" : "📌 Pin",
    `togglePin('${note._id}')`,
    note.isNotePinned ? "btn-warning" : "btn-secondary"
  );

  const deleteButton = createButton(
    "🗑️ Delete",
    `deleteNote('${note._id}')`,
    "btn-danger"
  );

  return editButton + pinButton + deleteButton;
}

/**
 * Create a button HTML element
 * @param {string} text - Button text
 * @param {string} onclick - Onclick handler
 * @param {string} className - CSS class name
 * @returns {string} HTML string
 */
function createButton(text, onclick, className) {
  return `<button class="btn btn-small ${className}" onclick="${onclick}">${text}</button>`;
}

/**
 * Update tag filter dropdown
 * @param {Array} notesToFilter - Array of notes to extract tags from
 */
function updateTagFilter(notesToFilter) {
  const tagFilter = document.getElementById("tagFilter");
  if (!tagFilter) return;

  const allTags = [...new Set(notesToFilter.flatMap((note) => note.noteTags))];

  tagFilter.innerHTML =
    '<option value="">All Tags</option>' +
    allTags
      .map(
        (tag) =>
          `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`
      )
      .join("");
}

/**
 * Filter notes by selected tag
 */
function filterByTag() {
  const selectedTag = document.getElementById("tagFilter").value;
  if (!selectedTag) {
    displayNotes(AppState.notes);
    return;
  }

  const filteredNotes = AppState.notes.filter((note) =>
    note.noteTags.includes(selectedTag)
  );
  displayNotes(filteredNotes);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  // Login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      login(email, password);
    });
  }

  // Signup form
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const fullName = document.getElementById("signupName").value;
      const email = document.getElementById("signupEmail").value;
      const phone = document.getElementById("signupPhone").value;
      const password = document.getElementById("signupPassword").value;
      signup(fullName, email, phone, password);
    });
  }

  // OTP form
  const otpForm = document.getElementById("otpForm");
  if (otpForm) {
    otpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const otpCode = document.getElementById("otpCode").value;
      if (AppState.pendingEmail) {
        verifyOtp(AppState.pendingEmail, otpCode);
      } else {
        showAlert(
          "otpAlert",
          "No pending email found. Please sign up again.",
          "error"
        );
      }
    });
  }

  // Note form
  const noteForm = document.getElementById("noteForm");
  if (noteForm) {
    noteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const title = document.getElementById("noteTitle").value;
      const content = document.getElementById("noteContent").value;
      const tags = document.getElementById("noteTags").value;
      createNote(title, content, tags);
    });
  }

  // Edit form
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (AppState.editingNote) {
        const title = document.getElementById("editTitle").value;
        const content = document.getElementById("editContent").value;
        const tags = document.getElementById("editTags").value;
        updateNoteFromModal(AppState.editingNote._id, title, content, tags);
      }
    });
  }

  // Search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchNotes();
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Only handle shortcuts when not in input fields
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return;
    }

    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Ctrl/Cmd + N for new note
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      const noteTitle = document.getElementById("noteTitle");
      if (noteTitle) {
        noteTitle.focus();
      }
    }

    // Escape to clear search or close modal
    if (e.key === "Escape") {
      const editModal = document.getElementById("editModal");
      if (editModal && !editModal.classList.contains("hidden")) {
        closeEditModal();
      } else {
        const searchInput = document.getElementById("searchInput");
        if (searchInput && searchInput.value) {
          searchInput.value = "";
          loadNotes();
        }
      }
    }
  });

  // Online/offline status
  window.addEventListener("online", function () {
    showAlert("noteAlert", "You are back online!", "success");
  });

  window.addEventListener("offline", function () {
    showAlert(
      "noteAlert",
      "You are currently offline. Some features may not work.",
      "error"
    );
  });

  // Store original button text for loading states
  const submitButtons = document.querySelectorAll('button[type="submit"]');
  submitButtons.forEach((button) => {
    button.setAttribute("data-original-text", button.textContent);
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Show keyboard shortcuts help
 */
function showKeyboardShortcuts() {
  const shortcuts = document.getElementById("keyboardShortcuts");
  if (shortcuts) {
    shortcuts.classList.add("show");
    setTimeout(() => {
      shortcuts.classList.remove("show");
    }, 3000);
  }
}

/**
 * Initialize the application
 */
function initializeApp() {
  initializeEventListeners();

  // Show keyboard shortcuts hint on first load
  setTimeout(() => {
    showKeyboardShortcuts();
  }, 2000);

  if (AppState.authToken) {
    showApp();
    loadUserProfile();
    loadNotes();
    loadStats();
  } else {
    showLogin();
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);
