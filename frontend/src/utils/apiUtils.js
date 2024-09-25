export const fetchMarketPrice = async (cardName, edition, grade) => {
    const response = await fetch(`/api/market-price?card_name=${encodeURIComponent(cardName)}&edition=${encodeURIComponent(edition)}&grade=${encodeURIComponent(grade)}`);
    if (response.ok) {
        const data = await response.json();
        return data.market_price;
    } else {
        return null;
    }
};

export const fetchCards = async () => {
    const response = await fetch('/api/cards');
    if (!response.ok) {
        throw new Error('Failed to fetch cards');
    }
    return response.json();
};

export const processFetchedCards = (data, verbose) => {
    if (verbose) console.log('Fetched data:', data); // Log fetched data

    const totalCostSum = data.reduce((acc, card) => {
        const price = parseFloat(card.price.replace(/[^0-9.-]+/g, ""));
        if (verbose) console.log(`Card price: ${card.price}, Parsed price: ${price}`); // Log each card's price
        return acc + (isNaN(price) ? 0 : price);
    }, 0);

    if (verbose) console.log('Total Cost Sum:', totalCostSum); // Log total cost sum

    return { totalCostSum, cards: data };
};
