import React from 'react';
import { CardMedia } from '@mui/material';

const CardImage = React.memo(({ image, alt, onMouseMove, onMouseLeave, ref }) => {
    return (
        <CardMedia
            component="img"
            className="card-image"
            image={image}
            alt={alt}
            ref={ref}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{ overflow: 'visible' }}
        />
    );
});

export default CardImage;
