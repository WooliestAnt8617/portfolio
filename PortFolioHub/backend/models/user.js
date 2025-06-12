// models/user.js
// -------------------------------------------------------------------
// File: models/user.js
// Location: portfolio-cms-backend/models/user.js
// Sequelize model for User
// -------------------------------------------------------------------
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
  });

  User.associate = (models) => {
    // A User has one Profile
    User.hasOne(models.Profile, {
      foreignKey: 'userId',
      onDelete: 'CASCADE', // If a User is deleted, their Profile is also deleted
    });
    // A User can have many Projects
    User.hasMany(models.Project, {
      foreignKey: 'userId',
      onDelete: 'CASCADE', // If a User is deleted, their Projects are also deleted
    });
    // A User can have many BlogPosts
    User.hasMany(models.BlogPost, {
      foreignKey: 'userId',
      onDelete: 'CASCADE', // If a User is deleted, their BlogPosts are also deleted
    });
  };

  return User;
};
