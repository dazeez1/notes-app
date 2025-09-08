const express = require("express");
const { body, param, query } = require("express-validator");
const noteController = require("../controllers/noteController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Validation rules for note creation
 */
const createNoteValidationRules = [
  body("noteTitle")
    .trim()
    .notEmpty()
    .withMessage("Note title is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Note title must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
    .withMessage("Note title contains invalid characters"),

  body("noteContent")
    .trim()
    .notEmpty()
    .withMessage("Note content is required")
    .isLength({ min: 1, max: 10000 })
    .withMessage("Note content must be between 1 and 10,000 characters"),

  body("noteTags")
    .optional()
    .isArray()
    .withMessage("Note tags must be an array")
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error("Maximum 10 tags allowed");
      }
      if (tags) {
        for (const tag of tags) {
          if (typeof tag !== "string" || tag.length < 1 || tag.length > 20) {
            throw new Error("Each tag must be 1-20 characters long");
          }
          if (!/^[a-zA-Z0-9\-]+$/.test(tag)) {
            throw new Error(
              "Tags can only contain letters, numbers, and hyphens"
            );
          }
        }
      }
      return true;
    }),
];

/**
 * Validation rules for note updates
 */
const updateNoteValidationRules = [
  param("noteId").isMongoId().withMessage("Invalid note ID format"),

  body("noteTitle")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Note title must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
    .withMessage("Note title contains invalid characters"),

  body("noteContent")
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Note content must be between 1 and 10,000 characters"),

  body("noteTags")
    .optional()
    .isArray()
    .withMessage("Note tags must be an array")
    .custom((tags) => {
      if (tags && tags.length > 10) {
        throw new Error("Maximum 10 tags allowed");
      }
      if (tags) {
        for (const tag of tags) {
          if (typeof tag !== "string" || tag.length < 1 || tag.length > 20) {
            throw new Error("Each tag must be 1-20 characters long");
          }
          if (!/^[a-zA-Z0-9\-]+$/.test(tag)) {
            throw new Error(
              "Tags can only contain letters, numbers, and hyphens"
            );
          }
        }
      }
      return true;
    }),

  body("isNotePinned")
    .optional()
    .isBoolean()
    .withMessage("isNotePinned must be a boolean value"),

  body("isNoteArchived")
    .optional()
    .isBoolean()
    .withMessage("isNoteArchived must be a boolean value"),
];

/**
 * Validation rules for note ID parameter
 */
const noteIdValidationRules = [
  param("noteId").isMongoId().withMessage("Invalid note ID format"),
];

/**
 * Validation rules for query parameters
 */
const queryValidationRules = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("skip")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Skip must be a non-negative integer"),

  query("includeArchived")
    .optional()
    .isBoolean()
    .withMessage("includeArchived must be a boolean value"),

  query("tag")
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage("Tag must be between 1 and 20 characters")
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage("Tag can only contain letters, numbers, and hyphens"),

  query("tags")
    .optional()
    .custom((tags) => {
      if (tags) {
        const tagArray = tags.split(",");
        if (tagArray.length > 10) {
          throw new Error("Maximum 10 tags allowed in query");
        }
        for (const tag of tagArray) {
          if (tag.length < 1 || tag.length > 20) {
            throw new Error("Each tag must be 1-20 characters long");
          }
          if (!/^[a-zA-Z0-9\-]+$/.test(tag)) {
            throw new Error(
              "Tags can only contain letters, numbers, and hyphens"
            );
          }
        }
      }
      return true;
    }),

  query("q")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2 and 100 characters"),
];

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Private (requires authentication)
 * @body    { noteTitle, noteContent, noteTags? }
 */
router.post(
  "/",
  authenticateToken,
  createNoteValidationRules,
  noteController.createNote
);

/**
 * @route   GET /api/notes
 * @desc    Get all notes for the authenticated user with optional filtering
 * @access  Private (requires authentication)
 * @query   { tag?, tags?, limit?, skip?, includeArchived? }
 */
router.get(
  "/",
  authenticateToken,
  queryValidationRules,
  noteController.getAllNotes
);

/**
 * @route   GET /api/notes/search
 * @desc    Search notes by title and content
 * @access  Private (requires authentication)
 * @query   { q, limit?, skip? }
 */
router.get(
  "/search",
  authenticateToken,
  queryValidationRules,
  noteController.searchNotes
);

/**
 * @route   GET /api/notes/stats
 * @desc    Get note statistics for the authenticated user
 * @access  Private (requires authentication)
 */
router.get("/stats", authenticateToken, noteController.getNoteStats);

/**
 * @route   GET /api/notes/:noteId
 * @desc    Get a single note by ID
 * @access  Private (requires authentication)
 * @params  { noteId }
 */
router.get(
  "/:noteId",
  authenticateToken,
  noteIdValidationRules,
  noteController.getNoteById
);

/**
 * @route   PUT /api/notes/:noteId
 * @desc    Update a note by ID
 * @access  Private (requires authentication)
 * @params  { noteId }
 * @body    { noteTitle?, noteContent?, noteTags?, isNotePinned?, isNoteArchived? }
 */
router.put(
  "/:noteId",
  authenticateToken,
  updateNoteValidationRules,
  noteController.updateNote
);

/**
 * @route   DELETE /api/notes/:noteId
 * @desc    Delete a note by ID
 * @access  Private (requires authentication)
 * @params  { noteId }
 */
router.delete(
  "/:noteId",
  authenticateToken,
  noteIdValidationRules,
  noteController.deleteNote
);

/**
 * @route   PATCH /api/notes/:noteId/pin
 * @desc    Toggle pin status of a note
 * @access  Private (requires authentication)
 * @params  { noteId }
 */
router.patch(
  "/:noteId/pin",
  authenticateToken,
  noteIdValidationRules,
  noteController.toggleNotePin
);

/**
 * @route   PATCH /api/notes/:noteId/archive
 * @desc    Toggle archive status of a note
 * @access  Private (requires authentication)
 * @params  { noteId }
 */
router.patch(
  "/:noteId/archive",
  authenticateToken,
  noteIdValidationRules,
  noteController.toggleNoteArchive
);

/**
 * @route   GET /api/notes/health
 * @desc    Health check for notes service
 * @access  Public
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Notes service is healthy",
    data: {
      service: "notes-app-notes",
      status: "operational",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
});

module.exports = router;
