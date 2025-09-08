const mongoose = require("mongoose");

/**
 * Note Schema for storing user notes with CRUD operations
 * Includes comprehensive validation and security features
 */
const noteSchema = new mongoose.Schema(
  {
    // Note Content
    noteTitle: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      minlength: [1, "Note title must be at least 1 character long"],
      maxlength: [100, "Note title cannot exceed 100 characters"],
      validate: {
        validator: function (value) {
          // Allow letters, numbers, spaces, and common punctuation
          return /^[a-zA-Z0-9\s\-_.,!?()]+$/.test(value);
        },
        message: "Note title contains invalid characters",
      },
    },

    noteContent: {
      type: String,
      required: [true, "Note content is required"],
      trim: true,
      minlength: [1, "Note content must be at least 1 character long"],
      maxlength: [10000, "Note content cannot exceed 10,000 characters"],
    },

    // Tags for categorization
    noteTags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          // Maximum 10 tags per note
          if (tags.length > 10) return false;

          // Each tag should be 1-20 characters, alphanumeric and hyphens only
          return tags.every(
            (tag) => /^[a-zA-Z0-9\-]{1,20}$/.test(tag) && tag.length >= 1
          );
        },
        message:
          "Tags must be 1-20 characters, alphanumeric with hyphens only. Maximum 10 tags allowed.",
      },
    },

    // User Reference
    noteOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Note owner is required"],
    },

    // Note Status
    isNoteArchived: {
      type: Boolean,
      default: false,
    },

    isNotePinned: {
      type: Boolean,
      default: false,
    },

    // Timestamps
    noteCreatedAt: {
      type: Date,
      default: Date.now,
    },

    noteUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
      transform: function (doc, ret) {
        // Remove internal fields from JSON output
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        // Remove internal fields from object output
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
noteSchema.index({ noteOwner: 1 }); // Index for user's notes
noteSchema.index({ noteTags: 1 }); // Index for tag filtering
noteSchema.index({ noteOwner: 1, noteTags: 1 }); // Compound index for user + tags
noteSchema.index({ noteOwner: 1, noteCreatedAt: -1 }); // Index for user's notes by date
noteSchema.index({ noteOwner: 1, isNotePinned: -1, noteCreatedAt: -1 }); // Index for pinned notes

// Text index for search functionality (future enhancement)
noteSchema.index(
  {
    noteTitle: "text",
    noteContent: "text",
  },
  {
    weights: {
      noteTitle: 10,
      noteContent: 5,
    },
  }
);

/**
 * Pre-save middleware to update the noteUpdatedAt timestamp
 */
noteSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.noteUpdatedAt = new Date();
  }
  next();
});

/**
 * Pre-update middleware to update the noteUpdatedAt timestamp
 */
noteSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
  this.set({ noteUpdatedAt: new Date() });
  next();
});

/**
 * Instance method to check if user owns this note
 * @param {string} userId - User ID to check ownership
 * @returns {boolean} - True if user owns the note
 */
noteSchema.methods.isOwnedBy = function (userId) {
  return this.noteOwner.toString() === userId.toString();
};

/**
 * Instance method to add a tag to the note
 * @param {string} tag - Tag to add
 * @returns {boolean} - True if tag was added successfully
 */
noteSchema.methods.addTag = function (tag) {
  if (this.noteTags.length >= 10) {
    return false; // Maximum tags reached
  }

  const normalizedTag = tag.toLowerCase().trim();
  if (!this.noteTags.includes(normalizedTag)) {
    this.noteTags.push(normalizedTag);
    return true;
  }
  return false; // Tag already exists
};

/**
 * Instance method to remove a tag from the note
 * @param {string} tag - Tag to remove
 * @returns {boolean} - True if tag was removed successfully
 */
noteSchema.methods.removeTag = function (tag) {
  const normalizedTag = tag.toLowerCase().trim();
  const tagIndex = this.noteTags.indexOf(normalizedTag);
  if (tagIndex > -1) {
    this.noteTags.splice(tagIndex, 1);
    return true;
  }
  return false; // Tag not found
};

/**
 * Static method to find notes by user ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of note documents
 */
noteSchema.statics.findByUserId = function (userId, options = {}) {
  const query = { noteOwner: userId };

  // Add tag filtering if specified
  if (options.tags && options.tags.length > 0) {
    query.noteTags = { $in: options.tags };
  }

  // Add archived filter if specified
  if (options.includeArchived === false) {
    query.isNoteArchived = false;
  }

  return this.find(query)
    .sort({ isNotePinned: -1, noteCreatedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

/**
 * Static method to find a note by ID and user ID (for ownership validation)
 * @param {string} noteId - Note ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Note document or null
 */
noteSchema.statics.findByIdAndUserId = function (noteId, userId) {
  return this.findOne({ _id: noteId, noteOwner: userId });
};

/**
 * Static method to get note statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Statistics object
 */
noteSchema.statics.getUserNoteStats = function (userId) {
  return this.aggregate([
    { $match: { noteOwner: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalNotes: { $sum: 1 },
        pinnedNotes: { $sum: { $cond: ["$isNotePinned", 1, 0] } },
        archivedNotes: { $sum: { $cond: ["$isNoteArchived", 1, 0] } },
        totalTags: { $sum: { $size: "$noteTags" } },
      },
    },
  ]);
};

/**
 * Static method to get popular tags for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of tags to return
 * @returns {Promise<Array>} - Array of popular tags
 */
noteSchema.statics.getPopularTags = function (userId, limit = 10) {
  return this.aggregate([
    { $match: { noteOwner: new mongoose.Types.ObjectId(userId) } },
    { $unwind: "$noteTags" },
    {
      $group: {
        _id: "$noteTags",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        tag: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);
};

// Create and export the Note model
const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
