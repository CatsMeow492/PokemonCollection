# Pokémon Card Collection App

[Visit the live site here!](https://cardvault.youngmohney.com/)
This project is a web application for managing and analyzing a collection of Pokémon cards. It provides various features such as viewing the collection, adding new cards, viewing reports, and shopping for new cards. 

**I don't know why every available app on github and IOS marketplace was terrible for fetching and recording live marketplace data but this fixes that problem.** Data is fetched and cached from ebay sold listings for each card's specific grade, edition, and name.

## Features

- **Collection Management**: View and manage your Pokémon card collection.
- **Reports**: Generate and view reports about your collection, including total cost, market price, and top cards.
- **Shop**: Browse and purchase new Pokémon cards and items.
- **Responsive Design**: The application is designed to work on various screen sizes.

## Components

### Header

The `Header` component provides navigation links to different parts of the application, including the Shop, Collection, and Reports pages.

### Shop

The `Shop` component displays a list of products available for purchase. Each product includes an image, name, price, and an "Add to Cart" button.

### Reports

The `Reports` component provides detailed insights into the Pokémon card collection. It includes summaries of total cards, total cost, total market price, total profit, and average card price. It also lists the top 5 most expensive and most profitable cards.

### Styles

The application uses custom CSS styles to enhance the visual appearance of the components. The styles are defined in various CSS files, such as `CardList.css` and `Header.css`.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pokemon-card-collection-app.git
   ```
2. Navigate to the project directory:
   ```bash
   cd pokemon-card-collection-app
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000` to view the application.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes and push the branch to your fork.
4. Create a pull request with a description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Acknowledgements

- This project uses the [Material-UI](https://mui.com/) library for UI components.
- Pokémon and Pokémon character names are trademarks of Nintendo.

## Contact

For any questions or feedback, please contact [your-email@example.com].
