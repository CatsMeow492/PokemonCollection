import React from 'react';
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material';
import AddCardForm from '../forms/AddCardForm';

const AddCardModal = ({ open, onClose, onAddCard }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
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