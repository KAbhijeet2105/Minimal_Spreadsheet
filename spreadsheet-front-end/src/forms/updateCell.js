import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const UpdateCellForm = ({
  open = false,
  onClose = () => {},
  onUpdateCell = () => {},
  rowId = "",
  columnName = "",
  cellValue = "",
  columnType = "date", // Default to text type
  options = [],
}) => {
  const [newValue, setNewValue] = useState(cellValue);
  const [selectedDate, handleDateChange] = useState("");

  useEffect(() => {
    // Reset the new value when the form opens
    setNewValue(cellValue);
  }, [cellValue, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(rowId)
    onUpdateCell(rowId,columnName,newValue);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Update Cell - {columnName}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          {(columnType === "text" || columnType === "number"  ) && (
            <TextField
              label="New Value"
              variant="outlined"
              margin="normal"
              fullWidth
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          )}
          {columnType === "singleSelect" && (
            <FormControl variant="outlined" fullWidth margin="normal" required>
              <InputLabel>Select Option</InputLabel>
              <Select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                label="Select Option"
              >
                {options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {columnType === "multiSelect" && (
            <FormControl variant="outlined" fullWidth margin="normal" required>
              <InputLabel>Select Options</InputLabel>
              <Select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                label="Select Options"
                multiple
              >
                {options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {columnType === "date" && (
            // <DatePicker
            //   label="Select Date"
            //   value={selectedDate}
            //   onChange={(date) => handleDateChange(date)}
            //   renderInput={(params) => <TextField {...params} />}
            //   adapter={AdapterDateFns}
            // />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Select Date"
                value={newValue}
                onChange={(date) => setNewValue(date?.toString())}
            
              />
            </LocalizationProvider>
          )}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleSubmit}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateCellForm;
