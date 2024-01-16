import express from "express";
import {
  addColumn,
  addEmptyRow,
  fetchAllColumnInfo,
  fetchSpreadsheetData,
  updateSpreadsheetData,
} from "../config/dbqueries.js";
const router = express.Router();

//add columns
router.post("/createColumn", async (req, res) => {
  const colInfo = req.body;
  console.log(colInfo);
 
  try {
    const resp = await addColumn(colInfo);
    return res.json(resp);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }


});

//add empty row in spreadsheet
router.post("/addEmptyRow", async (req, res) => {
  await addEmptyRow();

  res.status(200).send("Empty row added to the spreadsheet table.");
});

//fetch whole spreadsheet
router.get("/fetchSpreadsheetData", async (req, res) => {
  const data = await fetchSpreadsheetData();

  res.status(200).json(data);
});

router.get("/fetchAllColumnInfo", async (req, res) => {
  const columnInfoData = await fetchAllColumnInfo();

  res.status(200).json(columnInfoData);
});

router.put("/updateSpreadsheetData", async (req, res) => {
  const { id, columnName, colType, value } = req.body;

  if (!id || !columnName || !value || !colType) {
    return res.status(400).json({ error: "Invalid request parameters." });
  }

  await updateSpreadsheetData(id, columnName, colType, value);

  res.status(200).json({ message: "Spreadsheet data updated successfully." });
});

export default router;
