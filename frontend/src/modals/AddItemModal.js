import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import AddItemForm from '../forms/AddItemForm';
import '../styles/AddItemModal.css';

const AddItemModal = ({ open, onClose, onAddItem, collections }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title" className="add-item-modal">
      <DialogContent className="modal-content">
        <Typography variant="h6" className="modal-title">
          Add New Item
        </Typography>
        <AddItemForm onAddItem={onAddItem} collections={collections} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemModal;