import React from 'react';
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material';
import AddCardForm from '../forms/AddCardForm';

const AddCardModal = ({ open, onClose, onAddCard, collections, selectedCollection }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogContent>
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