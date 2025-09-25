# Graphic Walker Application

A modern, refactored data visualization and dashboard creation tool built with React and Node.js. This application allows users to upload CSV files, create interactive visualizations, and build dashboards using the powerful Graphic Walker library.

## 🚀 Features

### Core Functionality
- **CSV Data Processing**: Upload and process CSV files with advanced features
- **Interactive Visualizations**: Create charts and graphs using Graphic Walker
- **Dashboard Management**: Save, load, and manage multiple dashboards
- **Real-time Data Analysis**: Explore data with drag-and-drop interface

### Advanced Features
- **Pagination Support**: Handle large CSV files efficiently
- **Column Selection**: Read specific columns from CSV files
- **Data Type Detection**: Automatic field type detection and conversion
- **Error Handling**: Comprehensive validation and user feedback
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🏗️ Architecture

### Backend (Node.js + Express)
```
server/
├── src/
│   ├── config/          # Configuration management
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── data/                # JSON storage
├── uploads/             # File uploads
└── server.js           # Main server file
```

### Frontend (React)
```
client/
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service layer
│   ├── utils/           # Utility functions
│   ├── constants/       # Application constants
│   └── styles/          # CSS styles
├── public/              # Static assets
└── package.json
The frontend will start on http://localhost:3000

### Production Mode

#### Build the Frontend
```bash
cd client
npm run build
```

#### Start the Backend in Production
```bash
cd server
npm start
```

## 📊 API Documentation

### Dashboard Endpoints
- `GET /Dashboard` - Get all dashboards
- `POST /Dashboard` - Save/create dashboard
- `GET /Dashboard/stats` - Get dashboard statistics
- `GET /Dashboard/:name` - Get dashboard by name
- `DELETE /Dashboard/:name` - Delete dashboard

### Dataset Endpoints
- `GET /Dataset` - Get all datasets
- `POST /Dataset` - Save/create dataset
- `POST /Dataset/upload` - Upload dataset file
- `GET /Dataset/:name` - Get dataset by name
- `GET /Dataset/:name/data` - Get dataset data (supports pagination)
- `GET /Dataset/:name/info` - Get dataset file information
- `DELETE /Dataset/:name` - Delete dataset

### CSV Processing Endpoints
- `GET /api/csv/read` - Read complete CSV data
- `GET /api/csv/info` - Get CSV file metadata
- `GET /api/csv/columns` - Read specific CSV columns
- `GET /api/csv/paginated` - Read CSV data with pagination
- `GET /api/csv/stats` - Get CSV statistics and analysis

### Utility Endpoints
- `GET /health` - Health check
- `GET /` - API documentation

## 💾 Data Storage

The application uses **SurrealDB** for data persistence:
- **SurrealDB-Compatible Service**: In-memory storage with SurrealDB API
- **Dashboards**: Stored with UUID, timestamps, and validation
- **Datasets**: Metadata and file information with relationships
- **File Storage**: `uploads/` directory for uploaded CSV files
- **Migration**: Automatic migration from legacy JSON files

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
CLIENT_URL=http://localhost:3000

# SurrealDB Configuration (Optional)
SURREALDB_NAMESPACE=graphic_walker
SURREALDB_DATABASE=main
SURREALDB_USERNAME=root
SURREALDB_PASSWORD=root
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:5000
```

### Configuration Files
- `server/src/config/index.js` - Backend configuration
- `client/src/constants/` - Frontend constants and configuration

## 📁 File Upload Specifications

### Supported Formats
- **CSV Files**: `.csv` extension only
- **Maximum Size**: 50MB per file
- **Encoding**: UTF-8
- **Headers**: Required (first row)

### CSV Requirements
- Comma-separated values
- Headers in the first row
- Consistent column structure
- UTF-8 encoding recommended

## 🎨 User Interface

### Design Tab
- **Dataset Selection**: Choose from uploaded datasets
- **File Upload**: Drag-and-drop CSV file upload
- **Visualization Creation**: Interactive chart builder
- **Dashboard Saving**: Save configurations for later use

### View Tab
- **Dashboard Selection**: Browse saved dashboards
- **Interactive Viewing**: Explore saved visualizations
- **Multi-chart Support**: View dashboards with multiple charts

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### Integration Testing
The application includes comprehensive integration tests for:
- API endpoints
- File upload functionality
- Data processing
- Dashboard management

## 🚀 Deployment

### Using Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
1. Build the frontend: `npm run build` in client directory
2. Copy build files to server's static directory
3. Start the server: `npm start` in server directory
4. Configure reverse proxy (nginx/Apache) if needed

## 🔍 Troubleshooting

### Common Issues

#### Backend Won't Start
- Check if port 5000 is available
- Verify Node.js version (>=14.0.0)
- Check for missing dependencies: `npm install`

#### Frontend Won't Connect to Backend
- Verify backend is running on port 5000
- Check CORS configuration
- Verify API_URL in frontend configuration

#### File Upload Issues
- Check file size (max 50MB)
- Verify file format (.csv only)
- Ensure proper CSV structure with headers

#### Data Not Loading
- Check CSV file format and encoding
- Verify dataset was uploaded successfully
- Check browser console for errors

### Debug Mode
Enable debug logging by setting `LOG_LEVEL=debug` in backend environment.

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

### Code Style
- Use ESLint for JavaScript linting
- Follow React best practices
- Write meaningful commit messages
- Add tests for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review API documentation
- Check browser console for errors
- Verify file formats and sizes

## 🔄 Version History

### v2.0.0 (Current)
- Complete refactoring of codebase
- Improved architecture and organization
- Enhanced error handling and validation
- Better responsive design
- Comprehensive documentation

### v1.0.0 (Previous)
- Initial implementation
- Basic CSV processing
- Dashboard creation and viewing
- File upload functionality

## 🌟 Acknowledgments

- **Graphic Walker**: Powerful visualization library
- **React**: Frontend framework
- **Express.js**: Backend framework
- **csv-parser**: CSV processing library
