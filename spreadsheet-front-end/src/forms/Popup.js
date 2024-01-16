import React from "react";
import Modal from "react-modal";

const Popup = ({ isOpen, message, onRequestClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Error Popup"
    >
      <div>
        <h2>Error</h2>
        <p>{message}</p>
        <button onClick={onRequestClose}>Close</button>
      </div>
    </Modal>
  );
};

export default Popup;
