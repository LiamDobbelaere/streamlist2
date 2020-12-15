const Sequelize = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'streamlist2.db',
  logging: false
});

const StreamList = sequelize.define('StreamList', {
  title: {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.DataTypes.ENUM("game", "series", "movie"),
    defaultValue: "game"
  },
  isCoop: {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVersus: {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  paranoid: true
});

function isReady() {
  return sequelize.authenticate()
    .then(() => sequelize.sync({ alter: true }))
    .catch(console.log);
}

module.exports = {
  StreamList,
  isReady
};