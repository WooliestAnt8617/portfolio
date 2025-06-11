// models/project.js
// -------------------------------------------------------------------
// File: models/project.js
// Location: portfolio-cms-backend/models/project.js
// Sequelize model for Project
// -------------------------------------------------------------------
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { // Foreign key to User model
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    longDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      // Removed isUrl validation to allow empty string when optional
    },
    liveUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      // Removed isUrl validation to allow empty string when optional
    },
    repoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      // Removed isUrl validation to allow empty string when optional
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft',
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  Project.associate = (models) => {
    Project.belongsTo(models.User, {
      foreignKey: 'userId',
    });
    Project.hasMany(models.ProjectTechnology, {
      foreignKey: 'projectId',
      onDelete: 'CASCADE',
    });
  };

  return Project;
};
