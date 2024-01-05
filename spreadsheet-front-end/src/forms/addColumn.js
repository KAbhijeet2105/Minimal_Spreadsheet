import React, { useState } from "react";
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

const AddColumnForm = ({
  open = false,
  onClose = () => {},
  onAddColumn = () => {},
}) => {
  const [columnName, setColumnName] = useState("");
  const [dataType, setDataType] = useState("text");
  const [options, setOptions] = useState("");
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [isSingleSelect, setIsSingleSelect] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(columnName, dataType,options)
    onAddColumn({
        colTitle:columnName+"",
        colType:dataType,
        colOptions : {options: isMultiSelect || isSingleSelect ? options.split(",") : {} },
    });
  };

  

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Column</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Column Name"
            variant="outlined"
            margin="normal"
            fullWidth
            required
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
          />
          <FormControl variant="outlined" fullWidth margin="normal" required>
            <InputLabel>Data Type</InputLabel>
            <Select
              value={dataType}
              onChange={(e) => {
                setDataType(e.target.value);
                setIsMultiSelect(e.target.value === "multiSelect");
                setIsSingleSelect(e.target.value === "singleSelect");
              }}
              label="Data Type"
            >
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="singleSelect">Single Select</MenuItem>
              <MenuItem value="multiSelect">Multi Select</MenuItem>
            </Select>
          </FormControl>
          {(isMultiSelect || isSingleSelect) && (
            <TextField
              label="Options (comma-separated)"
              variant="outlined"
              margin="normal"
              fullWidth
              required
              value={options}
              onChange={(e) => setOptions(e.target.value)}
            />
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
          Add Column
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddColumnForm;
