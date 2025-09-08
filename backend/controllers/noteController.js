const Note = require("../models/Note");
const { validationResult } = require("express-validator");

/**
 * Note Controller
 * Handles CRUD operations for notes with owner validation and tag filtering
 */
class NoteController {
  /**
   * Create a new note
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createNote(req, res) {
    try {
      // Check for validation errors
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors.array().map((error) => ({
            field: error.path,
            message: error.msg,
            value: error.value,
          })),
        });
      }

      const { noteTitle, noteContent, noteTags } = req.body;
      const userId = req.user.id;

      // Create new note
      const newNote = new Note({
        noteTitle: noteTitle.trim(),
        noteContent: noteContent.trim(),
        noteTags: noteTags
          ? noteTags.map((tag) => tag.toLowerCase().trim())
          : [],
        noteOwner: userId,
      });

      // Save note to database
      const savedNote = await newNote.save();

      res.status(201).json({
        success: true,
        message: "Note created successfully",
        data: {
          note: savedNote,
        },
      });
    } catch (error) {
      console.error("Create note error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while creating note",
        error: "NOTE_CREATION_FAILED",
      });
    }
  }

  /**
   * Get all notes for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllNotes(req, res) {
    try {
      const userId = req.user.id;
      const {
        tag,
        tags,
        limit = 50,
        skip = 0,
        includeArchived = false,
      } = req.query;

      // Parse tag filtering
      let tagFilters = [];
      if (tag) {
        tagFilters = [tag.toLowerCase().trim()];
      } else if (tags) {
        tagFilters = tags.split(",").map((t) => t.toLowerCase().trim());
      }

      // Build query options
      const options = {
        limit: parseInt(limit),
        skip: parseInt(skip),
        includeArchived: includeArchived === "true",
        tags: tagFilters,
      };

      // Get notes for user
      const notes = await Note.findByUserId(userId, options);

      // Get total count for pagination
      const totalCount = await Note.countDocuments({
        noteOwner: userId,
        ...(tagFilters.length > 0 && { noteTags: { $in: tagFilters } }),
        ...(includeArchived === "false" && { isNoteArchived: false }),
      });

      res.status(200).json({
        success: true,
        message: "Notes retrieved successfully",
        data: {
          notes: notes,
          pagination: {
            total: totalCount,
            limit: parseInt(limit),
            skip: parseInt(skip),
            hasMore: parseInt(skip) + parseInt(limit) < totalCount,
          },
          filters: {
            tags: tagFilters,
            includeArchived: includeArchived === "true",
          },
        },
      });
    } catch (error) {
      console.error("Get all notes error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while retrieving notes",
        error: "NOTES_RETRIEVAL_FAILED",
      });
    }
  }

  /**
   * Get a single note by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getNoteById(req, res) {
    try {
      const { noteId } = req.params;
      const userId = req.user.id;

      // Find note by ID and user ID (ownership validation)
      const note = await Note.findByIdAndUserId(noteId, userId);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found or access denied",
          error: "NOTE_NOT_FOUND",
        });
      }

      res.status(200).json({
        success: true,
        message: "Note retrieved successfully",
        data: {
          note: note,
        },
      });
    } catch (error) {
      console.error("Get note by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while retrieving note",
        error: "NOTE_RETRIEVAL_FAILED",
      });
    }
  }

  /**
   * Update a note by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateNote(req, res) {
    try {
      // Check for validation errors
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors.array().map((error) => ({
            field: error.path,
            message: error.msg,
            value: error.value,
          })),
        });
      }

      const { noteId } = req.params;
      const userId = req.user.id;
      const { noteTitle, noteContent, noteTags, isNotePinned, isNoteArchived } =
        req.body;

      // Find note by ID and user ID (ownership validation)
      const note = await Note.findByIdAndUserId(noteId, userId);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found or access denied",
          error: "NOTE_NOT_FOUND",
        });
      }

      // Update note fields
      if (noteTitle !== undefined) note.noteTitle = noteTitle.trim();
      if (noteContent !== undefined) note.noteContent = noteContent.trim();
      if (noteTags !== undefined) {
        note.noteTags = noteTags.map((tag) => tag.toLowerCase().trim());
      }
      if (isNotePinned !== undefined) note.isNotePinned = isNotePinned;
      if (isNoteArchived !== undefined) note.isNoteArchived = isNoteArchived;

      // Save updated note
      const updatedNote = await note.save();

      res.status(200).json({
        success: true,
        message: "Note updated successfully",
        data: {
          note: updatedNote,
        },
      });
    } catch (error) {
      console.error("Update note error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while updating note",
        error: "NOTE_UPDATE_FAILED",
      });
    }
  }

  /**
   * Delete a note by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteNote(req, res) {
    try {
      const { noteId } = req.params;
      const userId = req.user.id;

      // Find and delete note by ID and user ID (ownership validation)
      const deletedNote = await Note.findOneAndDelete({
        _id: noteId,
        noteOwner: userId,
      });

      if (!deletedNote) {
        return res.status(404).json({
          success: false,
          message: "Note not found or access denied",
          error: "NOTE_NOT_FOUND",
        });
      }

      res.status(200).json({
        success: true,
        message: "Note deleted successfully",
        data: {
          deletedNote: {
            id: deletedNote._id,
            title: deletedNote.noteTitle,
            deletedAt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error("Delete note error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while deleting note",
        error: "NOTE_DELETION_FAILED",
      });
    }
  }

  /**
   * Get note statistics for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getNoteStats(req, res) {
    try {
      const userId = req.user.id;

      // Get note statistics
      const stats = await Note.getUserNoteStats(userId);
      const popularTags = await Note.getPopularTags(userId, 10);

      const userStats =
        stats.length > 0
          ? stats[0]
          : {
              totalNotes: 0,
              pinnedNotes: 0,
              archivedNotes: 0,
              totalTags: 0,
            };

      res.status(200).json({
        success: true,
        message: "Note statistics retrieved successfully",
        data: {
          statistics: userStats,
          popularTags: popularTags,
        },
      });
    } catch (error) {
      console.error("Get note stats error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while retrieving note statistics",
        error: "STATS_RETRIEVAL_FAILED",
      });
    }
  }

  /**
   * Search notes by title and content
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchNotes(req, res) {
    try {
      const userId = req.user.id;
      const { q: searchQuery, limit = 20, skip = 0 } = req.query;

      if (!searchQuery || searchQuery.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters long",
          error: "INVALID_SEARCH_QUERY",
        });
      }

      // Search notes using text index
      const notes = await Note.find({
        noteOwner: userId,
        $text: { $search: searchQuery.trim() },
        isNoteArchived: false,
      })
        .sort({ score: { $meta: "textScore" }, noteCreatedAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const totalCount = await Note.countDocuments({
        noteOwner: userId,
        $text: { $search: searchQuery.trim() },
        isNoteArchived: false,
      });

      res.status(200).json({
        success: true,
        message: "Search completed successfully",
        data: {
          notes: notes,
          searchQuery: searchQuery.trim(),
          pagination: {
            total: totalCount,
            limit: parseInt(limit),
            skip: parseInt(skip),
            hasMore: parseInt(skip) + parseInt(limit) < totalCount,
          },
        },
      });
    } catch (error) {
      console.error("Search notes error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while searching notes",
        error: "SEARCH_FAILED",
      });
    }
  }

  /**
   * Toggle note pin status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async toggleNotePin(req, res) {
    try {
      const { noteId } = req.params;
      const userId = req.user.id;

      // Find note by ID and user ID (ownership validation)
      const note = await Note.findByIdAndUserId(noteId, userId);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found or access denied",
          error: "NOTE_NOT_FOUND",
        });
      }

      // Toggle pin status
      note.isNotePinned = !note.isNotePinned;
      const updatedNote = await note.save();

      res.status(200).json({
        success: true,
        message: `Note ${updatedNote.isNotePinned ? "pinned" : "unpinned"} successfully`,
        data: {
          note: updatedNote,
        },
      });
    } catch (error) {
      console.error("Toggle note pin error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while toggling note pin",
        error: "PIN_TOGGLE_FAILED",
      });
    }
  }

  /**
   * Archive/Unarchive a note
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async toggleNoteArchive(req, res) {
    try {
      const { noteId } = req.params;
      const userId = req.user.id;

      // Find note by ID and user ID (ownership validation)
      const note = await Note.findByIdAndUserId(noteId, userId);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found or access denied",
          error: "NOTE_NOT_FOUND",
        });
      }

      // Toggle archive status
      note.isNoteArchived = !note.isNoteArchived;
      const updatedNote = await note.save();

      res.status(200).json({
        success: true,
        message: `Note ${updatedNote.isNoteArchived ? "archived" : "unarchived"} successfully`,
        data: {
          note: updatedNote,
        },
      });
    } catch (error) {
      console.error("Toggle note archive error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while toggling note archive",
        error: "ARCHIVE_TOGGLE_FAILED",
      });
    }
  }
}

// Create and export controller instance
const noteController = new NoteController();

module.exports = noteController;
