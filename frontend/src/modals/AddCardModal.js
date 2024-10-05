import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import AddCardForm from '../forms/AddCardForm';
import '../styles/AddCardModal.css';

const AddCardModal = ({ open, onClose, onAddCard, collections, selectedCollection }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title" className="add-card-modal">
      <DialogContent className="modal-content">
        <Typography variant="h6" className="modal-title">
          Add New Card
        </Typography>
        <AddCardForm onAddCard={onAddCard} collections={collections} selectedCollection={selectedCollection} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCardModal;