// models/sociallink.js
// -------------------------------------------------------------------
// File: models/sociallink.js
// Location: portfolio-cms-backend/models/sociallink.js
// Sequelize model for SocialLink
// -------------------------------------------------------------------
module.exports = (sequelize, DataTypes) => {
  const SocialLink = sequelize.define('SocialLink', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    profileId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Profiles', // table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
  });

  SocialLink.associate = (models) => {
    SocialLink.belongsTo(models.Profile, {
      foreignKey: 'profileId',
    });
  };

  return SocialLink;
};
