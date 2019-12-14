const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const slug = require("slug");

const User = mongoose.model("User");

const ArticleSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, lowercase: true },
    title: String,
    description: String,
    body: String,
    favoritesCount: { type: Number, default: 0 },
    tagList: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
  },
  { timestamps: true }
);

ArticleSchema.plugin(uniqueValidator, { message: "already exists" });

ArticleSchema.pre("validate", function(next) {
  if (!this.slug) {
    this.slugify();
  }

  next();
});

ArticleSchema.methods.slugify = function() {
  this.slug =
    slug(this.title) +
    "-" +
    ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};

ArticleSchema.methods.updateFavoriteCount = async function() {
  const article = this;

  const count = await User.countDocuments({
    favorites: { $in: [article._id] }
  });

  article.favoritesCount = count;

  return await article.save();
};

ArticleSchema.methods.toJSONFor = function(user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createAt: this.createAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    // favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor(user)
  };
};

module.exports = mongoose.model("Article", ArticleSchema);
