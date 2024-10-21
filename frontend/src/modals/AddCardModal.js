import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import AddCardForm from '../forms/AddCardForm';
import '../styles/AddCardModal.css';

const AddCardModal = ({ open, onClose, onCardAdded, collections }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title" className="add-card-modal">
      <DialogContent className="modal-content">
        <Typography variant="h6" className="modal-title">
          Add New Card
        </Typography>
        <AddCardForm 
          onCardAdded={onCardAdded}
          collections={collections}
          onClose={onClose}
        />
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
