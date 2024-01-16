import express, { json } from "express";
import cors from "cors";
import sequelize from "./config/dbconfig.js";
import { createColumnTable, createSpreadSheetTable } from "./config/dbqueries.js";
import controllerRoute from "./controller/controller.js";

const app = express();

app.use(cors());
app.use(json());

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "Connection to the database has been established successfully."
    );
    await createSpreadSheetTable();
    await createColumnTable();
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  } finally {
   // await sequelize.close();
  }
})();

app.use("/spreadsheet", controllerRoute);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
