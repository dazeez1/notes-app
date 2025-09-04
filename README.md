# Notes App

A robust CRUD (Create, Read, Update, Delete) notes API with advanced search and tagging capabilities. Built with Node.js and Express.js, this application provides a scalable backend solution for managing notes with full-text search and organizational features.

## Features

- **CRUD Operations**: Full Create, Read, Update, and Delete functionality for notes
- **Advanced Search**: Full-text search across note content and titles
- **Tagging System**: Organize notes with custom tags for better categorization
- **RESTful API**: Clean and intuitive REST API endpoints
- **Data Validation**: Input validation and sanitization
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Scalable Architecture**: Modular structure for easy maintenance and expansion

## Installation & Usage

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/dazeez1/notes-app.git
   cd notes-app
   ```

2. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start the server**

   ```bash
   npm start
   # or for development
   npm run dev
   ```

5. **Access the API**
   - Server will run on `http://localhost:3000` (or your configured port)
   - API documentation available at `/api-docs`

### API Endpoints

- `GET /api/notes` - Retrieve all notes
- `GET /api/notes/:id` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update an existing note
- `DELETE /api/notes/:id` - Delete a note
- `GET /api/notes/search?q=query` - Search notes
- `GET /api/notes/tags/:tag` - Get notes by tag

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi or express-validator
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI
- **Environment**: dotenv for configuration
- **CORS**: Cross-origin resource sharing support

## Project Structure

```
notes-app/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API route definitions
│   ├── middleware/     # Custom middleware
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   ├── server.js       # Main application entry point
│   └── package.json    # Backend dependencies
├── .gitignore          # Git ignore rules
└── README.md           # Project documentation
```

## Development

### Running Tests

```bash
cd backend
npm test
```

### Code Quality

```bash
npm run lint
npm run format
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Azeez Damilare Gbenga** - [GitHub Profile](https://github.com/dazeez1)

---

For questions, issues, or contributions, please open an issue on GitHub or contact the author.
