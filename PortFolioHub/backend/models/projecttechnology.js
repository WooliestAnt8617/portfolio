// models/projecttechnology.js
// -------------------------------------------------------------------
// File: models/projecttechnology.js
// Location: portfolio-cms-backend/models/projecttechnology.js
// Sequelize model for ProjectTechnology
// -------------------------------------------------------------------
module.exports = (sequelize, DataTypes) => {
  const ProjectTechnology = sequelize.define('ProjectTechnology', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Projects', // table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    technologyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  ProjectTechnology.associate = (models) => {
    ProjectTechnology.belongsTo(models.Project, {
      foreignKey: 'projectId',
    });
  };

  return ProjectTechnology;
};
