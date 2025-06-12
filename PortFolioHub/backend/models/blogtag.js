// models/blogtag.js
// -------------------------------------------------------------------
// File: models/blogtag.js
// Location: portfolio-cms-backend/models/blogtag.js
// Sequelize model for BlogTag
// -------------------------------------------------------------------
module.exports = (sequelize, DataTypes) => {
  const BlogTag = sequelize.define('BlogTag', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blogPostId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'BlogPosts', // table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    tagName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  BlogTag.associate = (models) => {
    BlogTag.belongsTo(models.BlogPost, {
      foreignKey: 'blogPostId',
    });
  };

  return BlogTag;
};
