import { Sequelize } from "sequelize";

const sequelize = new Sequelize("spreadsheet", "postgres", "postgres", {
  host: "localhost",
  dialect: "postgres",
  port: 5433,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 5000,
  },
});

export default sequelize;
