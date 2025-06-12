// models/blogpost.js
// -------------------------------------------------------------------
// File: models/blogpost.js
// Location: portfolio-cms-backend/models/blogpost.js
// Sequelize model for Blog Post
// -------------------------------------------------------------------
module.exports = (sequelize, DataTypes) => {
  const BlogPost = sequelize.define('BlogPost', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { // Foreign key to User model (author of the blog post)
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users', // table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Slugs should be unique for easy URL access
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrl: { // Optional image for the blog post header/thumbnail
      type: DataTypes.STRING,
      allowNull: true,
      // Removed isUrl validation to allow empty string when optional
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft',
    },
    publishedAt: { // Date when the blog post was published
      type: DataTypes.DATE,
      allowNull: true, // Null if in draft status
    },
  });

  BlogPost.associate = (models) => {
    // A BlogPost belongs to a User (author)
    BlogPost.belongsTo(models.User, { foreignKey: 'userId' });

    // A BlogPost can have many BlogTags
    BlogPost.hasMany(models.BlogTag, { foreignKey: 'blogPostId', onDelete: 'CASCADE' });
  };

  return BlogPost;
};
