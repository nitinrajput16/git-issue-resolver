const mongoose = require('mongoose');

const codePatchSchema = new mongoose.Schema({
  filename: String,
  before: String,
  after: String,
});

const resolutionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issueUrl: { type: String, required: true },
    owner: String,
    repo: String,
    issueNumber: Number,
    issueTitle: String,
    model: String,
    resolution: {
      rootCause: String,
      explanation: String,
      steps: [String],
      codeFix: [codePatchSchema],
      confidence: { type: String, enum: ['high', 'medium', 'low'] },
      suggestedLabels: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resolution', resolutionSchema);
