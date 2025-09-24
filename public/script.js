/**
 * Notes App Frontend - Complete API Testing Interface
 * Tests all endpoints with proper validation and error handling
 */

// Configuration
const CONFIG = {
  API_BASE: "http://localhost:3000/api",
  ALERT_TIMEOUT: 5000,
};

// Global state
const AppState = {
  authToken: localStorage.getItem("authToken"),
  currentUser: null,
  notes: [],
  pendingEmail: null,
};

// Utility functions
function showAlert(elementId, message, type = "info") {
  const alertElement = document.getElementById(elementId);
  if (!alertElement) return;

  alertElement.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    alertElement.innerHTML = "";
  }, CONFIG.ALERT_TIMEOUT);
}

function showFieldError(fieldId, message) {
  const errorElement = document.getElementById(fieldId);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearFieldError(fieldId) {
  const errorElement = document.getElementById(fieldId);
  if (errorElement) {
    errorElement.textContent = "";
  }
}

function logResponse(method, url, response, error = null) {
  const logElement = document.getElementById("responseLog");

  // Check if log element exists before trying to append
  if (!logElement) {
    console.warn("Response log element not found. Cannot log response.");
    return;
  }

  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement("div");
  logEntry.className = `log-entry ${error ? "error" : "success"}`;

  const logData = {
    timestamp,
    method,
    url,
    status: response?.status || "ERROR",
    response: error ? error.message : response?.data || response,
  };

  logEntry.textContent = `${timestamp} [${method}] ${url} - ${
    logData.status
  }\n${JSON.stringify(logData.response, null, 2)}`;

  try {
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
  } catch (appendError) {
    console.error("Failed to append log entry:", appendError);
  }
}

function setLoading(elementId, isLoading) {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (isLoading) {
    element.innerHTML =
      '<div class="loading"><div class="spinner"></div>Loading...</div>';
  }
}

// API request function with comprehensive error handling
async function apiRequest(url, options = {}) {
  const fullUrl = url.startsWith("http") ? url : `${CONFIG.API_BASE}${url}`;

  try {
    const response = await fetch(fullUrl, {
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

    // Log the response
    logResponse(options.method || "GET", fullUrl, {
      status: response.status,
      data,
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please login again.");
      }
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    logResponse(options.method || "GET", fullUrl, null, error);
    throw error;
  }
}

// Authentication functions
async function login(email, password) {
  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ emailAddress: email, password }),
    });

    if (data.success) {
      AppState.authToken = data.data.authToken;
      AppState.currentUser = data.data.user;
      localStorage.setItem("authToken", AppState.authToken);

      showAlert("authAlert", "Login successful!", "success");
      showUserInfo();
      showNotesSection();
      loadNotes();
    }
  } catch (error) {
    showAlert("authAlert", error.message, "error");
  }
}

async function signup(fullName, email, phone, password) {
  try {
    const data = await apiRequest("/auth/signup", {
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
        "authAlert",
        "Account created! Check your email for OTP.",
        "success"
      );
      AppState.pendingEmail = email.toLowerCase().trim();
      showOtpForm();
    }
  } catch (error) {
    showAlert("authAlert", error.message, "error");
  }
}

async function verifyOtp(otpCode) {
  try {
    const data = await apiRequest("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        emailAddress: AppState.pendingEmail,
        otpCode: otpCode,
      }),
    });

    if (data.success) {
      AppState.authToken = data.data.authToken;
      AppState.currentUser = data.data.user;
      localStorage.setItem("authToken", AppState.authToken);

      showAlert("authAlert", "Email verified! Welcome!", "success");
      showUserInfo();
      showNotesSection();
      loadNotes();
    }
  } catch (error) {
    showAlert("authAlert", error.message, "error");
  }
}

async function resendOtp() {
  try {
    const data = await apiRequest("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({
        emailAddress: AppState.pendingEmail,
      }),
    });

    if (data.success) {
      showAlert("authAlert", "OTP resent! Check your email.", "success");
    }
  } catch (error) {
    showAlert("authAlert", error.message, "error");
  }
}

async function loadUserProfile() {
  try {
    const data = await apiRequest("/auth/me");
    if (data.success) {
      AppState.currentUser = data.data.user;
      showUserInfo();
    }
  } catch (error) {
    console.error("Failed to load user profile:", error);
  }
}

function logout() {
  AppState.authToken = null;
  AppState.currentUser = null;
  AppState.notes = [];
  AppState.pendingEmail = null;
  localStorage.removeItem("authToken");

  // Hide user info and notes sections
  document.getElementById("userInfo").style.display = "none";
  document.getElementById("notesSection").style.display = "none";
  document.getElementById("apiTestSection").style.display = "none";

  // Restore authentication section title and show forms when user logs out
  const authSectionTitle = document.getElementById("authSectionTitle");
  if (authSectionTitle) {
    authSectionTitle.textContent = "🔐 Authentication";
  }
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("signupForm").style.display = "block";
  document.getElementById("otpForm").style.display = "none";
}

// Notes functions
async function createNote(title, content, tags) {
  try {
    const noteTags = tags
      ? tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    const data = await apiRequest("/notes", {
      method: "POST",
      body: JSON.stringify({
        noteTitle: title.trim(),
        noteContent: content.trim(),
        noteTags: noteTags,
      }),
    });

    if (data.success) {
      showAlert("notesAlert", "Note created successfully!", "success");
      document.getElementById("createNoteForm").reset();
      loadNotes();
    }
  } catch (error) {
    showAlert("notesAlert", error.message, "error");
  }
}

async function loadNotes() {
  setLoading("notesList", true);
  try {
    const data = await apiRequest("/notes");
    if (data.success) {
      AppState.notes = data.data.notes;
      displayNotes(AppState.notes);
    }
  } catch (error) {
    showAlert("notesAlert", error.message, "error");
  } finally {
    setLoading("notesList", false);
  }
}

async function searchNotes(query) {
  if (!query.trim()) {
    loadNotes();
    return;
  }

  setLoading("notesList", true);
  try {
    const data = await apiRequest(
      `/notes/search?q=${encodeURIComponent(query)}`
    );
    if (data.success) {
      AppState.notes = data.data.notes;
      displayNotes(AppState.notes);
    }
  } catch (error) {
    showAlert("notesAlert", error.message, "error");
  } finally {
    setLoading("notesList", false);
  }
}

async function filterNotesByTag(tag) {
  if (!tag.trim()) {
    loadNotes();
    return;
  }

  setLoading("notesList", true);
  try {
    const data = await apiRequest(`/notes?tag=${encodeURIComponent(tag)}`);
    if (data.success) {
      AppState.notes = data.data.notes;
      displayNotes(AppState.notes);
    }
  } catch (error) {
    showAlert("notesAlert", error.message, "error");
  } finally {
    setLoading("notesList", false);
  }
}

async function filterNotesByTags(tags) {
  if (!tags.trim()) {
    loadNotes();
    return;
  }

  setLoading("notesList", true);
  try {
    const data = await apiRequest(`/notes?tags=${encodeURIComponent(tags)}`);
    if (data.success) {
      AppState.notes = data.data.notes;
      displayNotes(AppState.notes);
    }
  } catch (error) {
    showAlert("notesAlert", error.message, "error");
  } finally {
    setLoading("notesList", false);
  }
}

async function updateNote(noteId, updates) {
  try {
    const data = await apiRequest(`/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    if (data.success) {
      showAlert("notesAlert", "Note updated successfully!", "success");
      loadNotes();
    }
  } catch (error) {
    showAlert("notesAlert", error.message, "error");
  }
}

async function deleteNote(noteId) {
  if (!confirm("Are you sure you want to delete this note?")) return;

  try {
    const data = await apiRequest(`/notes/${noteId}`, {
      method: "DELETE",
    });

    if (data.success) {
      showAlert("notesAlert", "Note deleted successfully!", "success");
      loadNotes();
    }
  } catch (error) {
    showAlert("notesAlert", error.message, "error");
  }
}

async function editNote(noteId) {
  const note = AppState.notes.find((n) => n._id === noteId);
  if (!note) return;

  // Create edit form
  const editForm = `
    <div class="edit-form">
      <h4>Edit Note</h4>
      <form id="editNoteForm">
        <div class="form-group">
          <label for="editNoteTitle">Title:</label>
          <input type="text" id="editNoteTitle" value="${escapeHtml(
            note.noteTitle
          )}" required minlength="1" maxlength="100">
          <div class="error-message" id="editNoteTitleError"></div>
        </div>
        <div class="form-group">
          <label for="editNoteContent">Content:</label>
          <textarea id="editNoteContent" required minlength="1" maxlength="10000">${escapeHtml(
            note.noteContent
          )}</textarea>
          <div class="error-message" id="editNoteContentError"></div>
        </div>
        <div class="form-group">
          <label for="editNoteTags">Tags (comma-separated):</label>
          <input type="text" id="editNoteTags" value="${
            note.noteTags ? note.noteTags.join(", ") : ""
          }" placeholder="work, urgent, personal">
          <div class="error-message" id="editNoteTagsError"></div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-success">Save Changes</button>
          <button type="button" onclick="cancelEdit('${noteId}')" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `;

  // Replace note card with edit form
  const noteCard = document.getElementById(`note-${noteId}`);
  if (noteCard) {
    noteCard.innerHTML = editForm;

    // Add event listener for edit form
    const editFormElement = document.getElementById("editNoteForm");
    if (editFormElement) {
      editFormElement.addEventListener("submit", function (e) {
        e.preventDefault();
        saveNoteEdit(noteId);
      });
    }
  }
}

async function saveNoteEdit(noteId) {
  const titleElement = document.getElementById("editNoteTitle");
  const contentElement = document.getElementById("editNoteContent");
  const tagsElement = document.getElementById("editNoteTags");

  if (!titleElement || !contentElement || !tagsElement) {
    showAlert("notesAlert", "Edit form elements not found", "error");
    return;
  }

  const title = titleElement.value;
  const content = contentElement.value;
  const tags = tagsElement.value;

  // Clear previous errors
  clearFieldError("editNoteTitleError");
  clearFieldError("editNoteContentError");
  clearFieldError("editNoteTagsError");

  const titleError = validateNoteTitle(title);
  const contentError = validateNoteContent(content);
  const tagsError = validateTags(tags);

  if (titleError) {
    showFieldError("editNoteTitleError", titleError);
    return;
  }
  if (contentError) {
    showFieldError("editNoteContentError", contentError);
    return;
  }
  if (tagsError) {
    showFieldError("editNoteTagsError", tagsError);
    return;
  }

  try {
    const noteTags = tags
      ? tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    const data = await apiRequest(`/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify({
        noteTitle: title.trim(),
        noteContent: content.trim(),
        noteTags: noteTags,
      }),
    });

    if (data.success) {
      showAlert("notesAlert", "Note updated successfully!", "success");
      loadNotes();
    }
  } catch (error) {
    showAlert("notesAlert", error.message, "error");
  }
}

function cancelEdit(noteId) {
  loadNotes();
}

async function loadStats() {
  try {
    const data = await apiRequest("/notes/stats");
    if (data.success) {
      displayStats(data.data.statistics);
    }
  } catch (error) {
    showAlert("notesAlert", error.message, "error");
  }
}

// Display functions
function displayNotes(notes) {
  const container = document.getElementById("notesList");
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = '<p class="text-center">No notes found.</p>';
    return;
  }

  container.innerHTML = notes
    .map(
      (note) => `
        <div class="note-card" id="note-${note._id}">
            <div class="note-title">${escapeHtml(note.noteTitle)}</div>
            <div class="note-content">${escapeHtml(note.noteContent)}</div>
            ${
              note.noteTags && note.noteTags.length > 0
                ? `
                <div class="note-tags">
                    ${note.noteTags
                      .map(
                        (tag) => `<span class="tag">${escapeHtml(tag)}</span>`
                      )
                      .join("")}
                </div>
            `
                : ""
            }
            <div class="note-meta">
                Created: ${new Date(note.noteCreatedAt).toLocaleDateString()}
                ${
                  note.noteUpdatedAt !== note.noteCreatedAt
                    ? ` | Updated: ${new Date(
                        note.noteUpdatedAt
                      ).toLocaleDateString()}`
                    : ""
                }
            </div>
            <div class="note-actions">
                <button onclick="editNote('${
                  note._id
                }')" class="btn-success">Edit</button>
                <button onclick="deleteNote('${
                  note._id
                }')" class="btn-danger">Delete</button>
            </div>
        </div>
    `
    )
    .join("");
}

function displayStats(stats) {
  const container = document.getElementById("notesStats");
  if (!container) return;

  container.style.display = "block";
  container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${stats.totalNotes || 0}</div>
                <div class="stat-label">Total Notes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.pinnedNotes || 0}</div>
                <div class="stat-label">Pinned Notes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.archivedNotes || 0}</div>
                <div class="stat-label">Archived Notes</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.totalTags || 0}</div>
                <div class="stat-label">Total Tags</div>
            </div>
        </div>
    `;
}

function showUserInfo() {
  const userInfo = document.getElementById("userInfo");
  const userDetails = document.getElementById("userDetails");
  const authSectionTitle = document.getElementById("authSectionTitle");

  if (AppState.currentUser) {
    userDetails.innerHTML = `
            <p><strong>Name:</strong> ${escapeHtml(
              AppState.currentUser.fullName
            )}</p>
            <p><strong>Email:</strong> ${escapeHtml(
              AppState.currentUser.emailAddress
            )}</p>
            <p><strong>Phone:</strong> ${escapeHtml(
              AppState.currentUser.phoneNumber
            )}</p>
            <p><strong>Email Verified:</strong> ${
              AppState.currentUser.isEmailVerified ? "✅" : "❌"
            }</p>
        `;
    userInfo.style.display = "block";

    // Change section title and hide authentication forms when user is logged in
    if (authSectionTitle) {
      authSectionTitle.textContent = "User Profile";
    }
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("otpForm").style.display = "none";
  }
}

function showNotesSection() {
  document.getElementById("notesSection").style.display = "block";
  document.getElementById("apiTestSection").style.display = "block";
}

function showOtpForm() {
  document.getElementById("otpForm").style.display = "block";
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "none";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// API Testing function
async function testEndpoint(method, endpoint) {
  try {
    const data = await apiRequest(endpoint, { method });
    showAlert("apiTestResults", `${method} ${endpoint} - Success!`, "success");
  } catch (error) {
    showAlert(
      "apiTestResults",
      `${method} ${endpoint} - Error: ${error.message}`,
      "error"
    );
  }
}

// Input validation functions
function validateName(name) {
  if (!name || name.trim().length < 2 || name.trim().length > 50) {
    return "Name must be 2-50 characters long";
  }
  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes";
  }
  return null;
}

function validateEmail(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
}

function validatePhone(phone) {
  if (
    !phone ||
    !/^[\+]?[0-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ""))
  ) {
    return "Please enter a valid phone number";
  }
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

function validateNoteTitle(title) {
  if (!title || title.trim().length < 1 || title.trim().length > 100) {
    return "Note title must be 1-100 characters long";
  }
  if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(title)) {
    return "Note title contains invalid characters";
  }
  return null;
}

function validateNoteContent(content) {
  if (!content || content.trim().length < 1 || content.trim().length > 10000) {
    return "Note content must be 1-10,000 characters long";
  }
  return null;
}

function validateTags(tags) {
  if (!tags) return null;

  const tagArray = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag);

  if (tagArray.length > 10) {
    return "Maximum 10 tags allowed";
  }

  for (const tag of tagArray) {
    if (tag.length < 1 || tag.length > 20) {
      return "Each tag must be 1-20 characters long";
    }
    if (!/^[a-zA-Z0-9\-]+$/.test(tag)) {
      return "Tags can only contain letters, numbers, and hyphens";
    }
  }

  return null;
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Login form
  const loginForm = document.getElementById("loginFormElement");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const emailElement = document.getElementById("loginEmail");
      const passwordElement = document.getElementById("loginPassword");

      if (!emailElement || !passwordElement) {
        showAlert("authAlert", "Login form elements not found", "error");
        return;
      }

      const email = emailElement.value;
      const password = passwordElement.value;

      // Clear previous errors
      clearFieldError("loginEmailError");
      clearFieldError("loginPasswordError");

      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);

      if (emailError) {
        showFieldError("loginEmailError", emailError);
        return;
      }
      if (passwordError) {
        showFieldError("loginPasswordError", passwordError);
        return;
      }

      login(email, password);
    });
  }

  // Signup form
  const signupForm = document.getElementById("signupFormElement");
  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const nameElement = document.getElementById("signupName");
      const emailElement = document.getElementById("signupEmail");
      const phoneElement = document.getElementById("signupPhone");
      const passwordElement = document.getElementById("signupPassword");

      if (!nameElement || !emailElement || !phoneElement || !passwordElement) {
        showAlert("authAlert", "Signup form elements not found", "error");
        return;
      }

      const name = nameElement.value;
      const email = emailElement.value;
      const phone = phoneElement.value;
      const password = passwordElement.value;

      // Clear previous errors
      clearFieldError("signupNameError");
      clearFieldError("signupEmailError");
      clearFieldError("signupPhoneError");
      clearFieldError("signupPasswordError");

      const nameError = validateName(name);
      const emailError = validateEmail(email);
      const phoneError = validatePhone(phone);
      const passwordError = validatePassword(password);

      if (nameError) {
        showFieldError("signupNameError", nameError);
        return;
      }
      if (emailError) {
        showFieldError("signupEmailError", emailError);
        return;
      }
      if (phoneError) {
        showFieldError("signupPhoneError", phoneError);
        return;
      }
      if (passwordError) {
        showFieldError("signupPasswordError", passwordError);
        return;
      }

      signup(name, email, phone, password);
    });
  }

  // OTP form
  const otpForm = document.getElementById("otpFormElement");
  if (otpForm) {
    otpForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const otpElement = document.getElementById("otpCode");
      if (!otpElement) {
        showAlert("authAlert", "OTP form element not found", "error");
        return;
      }

      const otpCode = otpElement.value;

      // Clear previous errors
      clearFieldError("otpCodeError");

      if (!otpCode || !/^[0-9]{6}$/.test(otpCode)) {
        showFieldError("otpCodeError", "Please enter a valid 6-digit OTP code");
        return;
      }

      verifyOtp(otpCode);
    });
  }

  // Resend OTP
  const resendOtpBtn = document.getElementById("resendOtp");
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", resendOtp);
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Create note form
  const createNoteForm = document.getElementById("createNoteForm");
  if (createNoteForm) {
    createNoteForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const titleElement = document.getElementById("noteTitle");
      const contentElement = document.getElementById("noteContent");
      const tagsElement = document.getElementById("noteTags");

      if (!titleElement || !contentElement || !tagsElement) {
        showAlert("notesAlert", "Note form elements not found", "error");
        return;
      }

      const title = titleElement.value;
      const content = contentElement.value;
      const tags = tagsElement.value;

      // Clear previous errors
      clearFieldError("noteTitleError");
      clearFieldError("noteContentError");
      clearFieldError("noteTagsError");

      const titleError = validateNoteTitle(title);
      const contentError = validateNoteContent(content);
      const tagsError = validateTags(tags);

      if (titleError) {
        showFieldError("noteTitleError", titleError);
        return;
      }
      if (contentError) {
        showFieldError("noteContentError", contentError);
        return;
      }
      if (tagsError) {
        showFieldError("noteTagsError", tagsError);
        return;
      }

      createNote(title, content, tags);
    });
  }

  // Search button
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", function () {
      const queryElement = document.getElementById("searchQuery");
      if (!queryElement) {
        showAlert("notesAlert", "Search input not found", "error");
        return;
      }
      const query = queryElement.value;
      searchNotes(query);
    });
  }

  // Filter by tag button
  const filterBtn = document.getElementById("filterBtn");
  if (filterBtn) {
    filterBtn.addEventListener("click", function () {
      const tagElement = document.getElementById("tagFilter");
      if (!tagElement) {
        showAlert("notesAlert", "Tag filter input not found", "error");
        return;
      }
      const tag = tagElement.value;
      filterNotesByTag(tag);
    });
  }

  // Filter by multiple tags button
  const tagsFilterBtn = document.getElementById("tagsFilterBtn");
  if (tagsFilterBtn) {
    tagsFilterBtn.addEventListener("click", function () {
      const tagsElement = document.getElementById("tagsFilter");
      if (!tagsElement) {
        showAlert("notesAlert", "Tags filter input not found", "error");
        return;
      }
      const tags = tagsElement.value;
      filterNotesByTags(tags);
    });
  }

  // Refresh button
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadNotes);
  }

  // Stats button
  const statsBtn = document.getElementById("statsBtn");
  if (statsBtn) {
    statsBtn.addEventListener("click", loadStats);
  }

  // Clear log button
  const clearLogBtn = document.getElementById("clearLogBtn");
  if (clearLogBtn) {
    clearLogBtn.addEventListener("click", function () {
      const responseLog = document.getElementById("responseLog");
      if (responseLog) {
        responseLog.innerHTML = "";
      }
    });
  }

  // Initialize app
  if (AppState.authToken) {
    loadUserProfile();
    showNotesSection();
    loadNotes();
  }
});
