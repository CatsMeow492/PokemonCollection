import { createCollection, deleteCollection, fetchCollectionsByUserID } from '../utils/apiUtils';

export const handleAddCollection = async (userId, collectionName, setCollections) => {
    try {
        const result = await createCollection(userId, collectionName);
        if (result.success) {
            console.log('Collection created successfully');
            // Refresh collections list immediately after creation
            await refreshCollections(userId, setCollections);
        }
    } catch (error) {
        console.error('Failed to create collection:', error);
        // You might want to show an error message to the user here
    }
};

export const handleDeleteCollection = async (userId, collectionName, onCollectionDeleted) => {
    try {
        await deleteCollection(userId, collectionName);
        // Call the callback function to handle state updates
        if (onCollectionDeleted) {
            onCollectionDeleted();
        }
    } catch (error) {
        console.error('Failed to delete collection:', error);
    }
};

// Helper function to refresh collections
export const refreshCollections = async (userId, setCollections) => {
    try {
        const data = await fetchCollectionsByUserID(userId);
        if (typeof setCollections === 'function') {
            setCollections(data || []);
        } else {
            console.error('setCollections is not a function', setCollections);
        }
    } catch (error) {
        console.error('Error fetching collections:', error);
    }
};
