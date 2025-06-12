// models/profile.js
// -------------------------------------------------------------------
// File: models/profile.js
// Location: portfolio-cms-backend/models/profile.js
// Sequelize model for User Profile
// -------------------------------------------------------------------
module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // Each user should have only one profile
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resumeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    interests: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('interests');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('interests', JSON.stringify(value));
      }
    },
    websiteUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    primaryColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#2563eb',
    },
    secondaryColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#9333ea',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft',
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  });

  Profile.associate = (models) => {
    Profile.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'CASCADE',
    });
    Profile.hasMany(models.SocialLink, {
      foreignKey: 'profileId',
      onDelete: 'CASCADE'
    });
    Profile.hasMany(models.Project, {
      foreignKey: 'userId',
      sourceKey: 'userId',
      onDelete: 'CASCADE'
    });
    Profile.hasMany(models.BlogPost, {
      foreignKey: 'userId',
      sourceKey: 'userId',
      onDelete: 'CASCADE'
    });
  };

  return Profile;
};
