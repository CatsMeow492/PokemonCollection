export const handleMouseMove = (e, index, cardImageRef) => {
    if (!cardImageRef) return; // Guard clause in case the ref is not set

    const quantityBubble = cardImageRef.parentElement.querySelector('.quantity-bubble');
    const rect = cardImageRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const percentX = deltaX / centerX;
    const percentY = deltaY / centerY;
    const angleX = percentY * 35; // Adjust the tilt angle
    const angleY = -percentX * 35; // Adjust the tilt angle

    // Calculate distance from cursor to center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    const glowIntensity = Math.max(0, 1 - distance / maxDistance); // Normalize to [0, 1]

    cardImageRef.style.background = `radial-gradient(circle at ${x}px ${y - rect.height / 4}px, rgba(255, 255, 255, ${glowIntensity}), rgba(255, 255, 255, 0.2) 40%, transparent 60%)`; // Adjusted for top half sparkle
    cardImageRef.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.15)`;
    cardImageRef.style.boxShadow = `0 0 ${30 * glowIntensity}px rgba(255, 255, 255, ${glowIntensity}), 0 0 ${60 * glowIntensity}px rgba(255, 255, 255, ${glowIntensity * 0.8}), 0 0 ${90 * glowIntensity}px rgba(255, 255, 255, ${glowIntensity * 0.6})`;

    if (quantityBubble) {
        quantityBubble.classList.add('hover');
    }
};

export const handleMouseLeave = (index, cardImageRef) => {
    if (!cardImageRef) return; // Guard clause in case the ref is not set

    const quantityBubble = cardImageRef.parentElement.querySelector('.quantity-bubble');
    cardImageRef.style.transform = 'rotateX(0) rotateY(0) scale(1)';
    cardImageRef.style.background = 'rgba(255, 255, 255, 0.3)';
    cardImageRef.style.boxShadow = 'none';

    if (quantityBubble) {
        quantityBubble.classList.remove('hover');
    }
};