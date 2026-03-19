const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    githubId:    { type: String, required: true, unique: true },
    username:    { type: String, required: true },
    displayName: String,
    email:       String,
    avatarUrl:   String,
    accessToken: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.methods.getAccessToken = function () {
  return this.accessToken;
};

module.exports = mongoose.model('User', userSchema);