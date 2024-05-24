const { MYSQL_DATABASE, MYSQL_PORT, MYSQL_USER, MYSQL_PASS } = process.env;

const Sequelize = require("sequelize");
let sequelize;

if (MYSQL_DATABASE) {
  console.log("(database connection = mysql)");
  sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PASS, {
    dialect: "mysql",
    port: MYSQL_PORT,
    logging: false,
  });
} else {
  console.log("(database connection = sqlite)");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "streamlist2.db",
    logging: false,
  });
}

const StreamList = sequelize.define(
  "StreamList",
  {
    title: {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: Sequelize.DataTypes.ENUM("game", "series", "movie"),
      defaultValue: "game",
    },
    isCoop: {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isVersus: {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    paranoid: true,
  }
);

sequelize
  .authenticate()
  .then(() => sequelize.sync({ alter: true }))
  .catch(console.log);

module.exports = {
  StreamList,
};
