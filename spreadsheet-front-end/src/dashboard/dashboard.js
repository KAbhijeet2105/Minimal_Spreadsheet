import { useEffect, useState } from "react";
import "./dashboard.css";
import axios from "axios";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
import AddColumnForm from "../forms/addColumn.js";
import UpdateCellForm from "../forms/updateCell.js";
import dayjs from "dayjs";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    border: "2px solid rgba(255, 255, 255, 0.32)", // Border color for header cells
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    border: "2px solid rgba(224, 224, 224, 1)", // Border color for body cells
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    //border: 0,
  },
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
}));

function Dashboard() {
  const [data, setData] = useState([]);
  const [colinfo, setColinfo] = useState([]);
  const [openAddColumnForm, setOpenAddColumnForm] = useState(false);
  const [openUpdateCellForm, setOpenUpdateCellForm] = useState(false);
  const [selectedCell, setSelectedCell] = useState({
    id: null,
    rowIndex: null,
    columnIndex: null,
    value: null,
    cellInfo: {},
  });

  const [summaryData, setSummaryData] = useState([]); //for calculating summary

  useEffect(() => {
    axios
      .get("http://localhost:5000/spreadsheet/fetchSpreadsheetData")
      .then((response) => {
        setData(response.data);
      });
    axios
      .get("http://localhost:5000/spreadsheet/fetchAllColumnInfo")
      .then((response) => {
        setColinfo(response.data);
        // console.log(response.data)

        calculateSummaryData(data, colinfo);
      });
  }, []);

  //calculate summary data

  const calculateSummaryData = (data, colinfo) => {
    colinfo.forEach((column) => {
      const { coltitle, coldatatype } = column;
      // Now you can use coltitle and coldatatype as variables
      console.log(
        `Column Title: ${coltitle}, Column Data Type: ${coldatatype}`
      );

      let numericSum = 0;
      console.log("column title :" + coltitle);

      data.forEach((item) => {
        if (coldatatype === "number" && item[coltitle] !== undefined) {
          console.log("column price : "+ item[coltitle]);
        
          if (!isNaN(item[coltitle]))
           numericSum += parseInt(item[coltitle]);
        }
      });
      const summaryObject = { coltitle: numericSum };
      console.log("total : " + numericSum);
      summaryData.push(summaryObject);
      //console.log(summaryObject);
    }); // outer colInfo loop ends
  };

  const addNewRow = () => {
    axios.post("http://localhost:5000/spreadsheet/addEmptyRow").then(() => {
      axios
        .get("http://localhost:5000/spreadsheet/fetchSpreadsheetData")
        .then((response) => {
          setData(response.data);
        });
      axios
        .get("http://localhost:5000/spreadsheet/fetchAllColumnInfo")
        .then((response) => {
          setColinfo(response.data);
          console.log(response.data);
        });
    });
  };

  const addColumn = () => {
    console.log("Add Column logic");
  };

  const handleAddColumn = (columnData) => {
    axios
      .post("http://localhost:5000/spreadsheet/createColumn", columnData)
      .then(() => {
        // After successfully adding the column, fetch the updated data
        axios
          .get("http://localhost:5000/spreadsheet/fetchSpreadsheetData")
          .then((response) => {
            setData(response.data);
            setOpenAddColumnForm(false);
          });
        axios
          .get("http://localhost:5000/spreadsheet/fetchAllColumnInfo")
          .then((response) => {
            setColinfo(response.data);
            console.log(response.data);
          });
      })
      .catch((error) => {
        console.error("Error adding column:", error);
      });
  };

  const handleCellDoubleClick = (rowIndex, columnIndex, id, value) => {
    console.log(columnIndex);
    const cellInfo = colinfo.find((cell) => {
      return cell.coltitle.toLowerCase() === columnIndex;
    });
    console.log(cellInfo);
    console.log(value);
    if (cellInfo.coldatatype === "date") value = dayjs(value);
    if (cellInfo.coldatatype === "multiSelect" && value === null) value = [];
    setSelectedCell({ id, rowIndex, columnIndex, value, cellInfo });
    setOpenUpdateCellForm(true);
  };

  const handleUpdateCellQuery = (id, colName, newVal) => {
    console.log(id, colName, newVal);
    axios
      .put("http://localhost:5000/spreadsheet/updateSpreadsheetData", {
        id,
        columnName: colName,
        value: newVal,
      })
      .then(() => {
        axios
          .get("http://localhost:5000/spreadsheet/fetchSpreadsheetData")
          .then((response) => {
            setData(response.data);
            setOpenAddColumnForm(false);
          });
        axios
          .get("http://localhost:5000/spreadsheet/fetchAllColumnInfo")
          .then((response) => {
            setColinfo(response.data);
            console.log(response.data);
          });
      })
      .catch((error) => {
        console.error("Error adding column:", error);
      });
  };
  return (
    <div className="Dashboard">
      <div className="centered-dashboard">
        {/* update cell : user enters/updates data */}
        {selectedCell.rowIndex !== null && (
          <UpdateCellForm
            open={openUpdateCellForm}
            onClose={() => {
              setOpenUpdateCellForm(false);
              setSelectedCell({
                id: null,
                rowIndex: null,
                columnIndex: null,
                value: null,
                cellInfo: {},
              });
            }}
            onUpdateCell={handleUpdateCellQuery}
            rowId={selectedCell.id}
            columnName={selectedCell.columnIndex}
            cellValue={selectedCell.value}
            columnType={selectedCell.cellInfo.coldatatype}
            options={selectedCell.cellInfo.options.options}
          ></UpdateCellForm>
        )}
        {/* add new column with user input */}
        <AddColumnForm
          open={openAddColumnForm}
          onClose={() => {
            setOpenAddColumnForm(false);
          }}
          onAddColumn={handleAddColumn}
        ></AddColumnForm>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell> </StyledTableCell>
                {Object.keys(data[0] || {}).map(
                  (column) =>
                    column !== "id" &&
                    column !== "isdeleted" && (
                      <StyledTableCell key={column}>{column}</StyledTableCell>
                    )
                )}
                <StyledTableCell align="right">
                  <Button
                    variant="outlined"
                    onClick={() => setOpenAddColumnForm(true)}
                    //onClick={() => addColumn() }
                    open={() => setOpenAddColumnForm(true)}
                    onClose={() => setOpenAddColumnForm(false)}
                    onAddColumn={handleAddColumn}
                    style={{ backgroundColor: "white", color: "black" }}
                    startIcon={<AddIcon />}
                  >
                    Add Column
                  </Button>
                </StyledTableCell>
              </TableRow>
              <TableRow>
                <StyledTableCell> Summary: </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, rowIndex) => (
                <StyledTableRow key={rowIndex}>
                  <StyledTableCell>{rowIndex + 1}</StyledTableCell>
                  {Object.keys(row).map(
                    (cell, cellIndex) =>
                      cell !== "id" &&
                      cell !== "isdeleted" && (
                        <StyledTableCell
                          key={cellIndex}
                          onDoubleClick={() =>
                            handleCellDoubleClick(
                              rowIndex,
                              cell,
                              row["id"],
                              row[cell]
                            )
                          }
                        >
                          {Array.isArray(row[cell])
                            ? row[cell].map((item) => <>{item} </>)
                            : row[cell]}
                        </StyledTableCell>
                      )
                  )}
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <Fab
        color="primary"
        aria-label="add"
        style={{ position: "fixed", bottom: 16, left: 16 }}
        onClick={addNewRow}
      >
        <AddIcon />
      </Fab>
    </div>
  );
}

export default Dashboard;
