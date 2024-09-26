import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import AddCardForm from './AddCardForm';

const AddCardModal = ({ open, onClose, onAddCard }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Add New Card</DialogTitle>
      <DialogContent>
        <AddCardForm onAddCard={onAddCard} />
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