export const fetchMarketPrice = async (cardName, edition, grade) => {
    const response = await fetch(`/api/market-price?card_name=${encodeURIComponent(cardName)}&edition=${encodeURIComponent(edition)}&grade=${encodeURIComponent(grade)}`);
    if (response.ok) {
        const data = await response.json();
        return data.market_price;
    } else {
        return null;
    }
};
