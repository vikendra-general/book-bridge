const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired codes
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Clean up old codes before creating new one
passwordResetSchema.statics.cleanupOldCodes = async function(email) {
  await this.deleteMany({ email, verified: false });
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
