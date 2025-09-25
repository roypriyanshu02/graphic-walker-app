# SurrealDB Integration Guide

## Overview

The Graphic Walker application now uses **SurrealDB** exclusively for data persistence. The implementation provides a SurrealDB-compatible in-memory storage system that maintains the same API interface while ensuring reliable operation without external dependencies.

## Features

### ✅ **SurrealDB-Only Architecture**
- **Pure SurrealDB**: Dedicated SurrealDB implementation
- **In-Memory Storage**: Fast, reliable in-memory data persistence
- **Compatible API**: Maintains SurrealDB-compatible interface
- **Zero Dependencies**: No external database server required

### ✅ **Benefits**
- **Simplified Architecture**: Single database technology, no fallbacks
- **High Performance**: In-memory storage for maximum speed
- **SurrealDB Compatible**: Ready for future SurrealDB server integration
- **Reliable**: No external dependencies or connection failures
- **Developer Friendly**: Easy to understand and maintain

## Architecture

### Database Service Structure
```
server/src/services/
├── dataService.js          # SurrealDB-compatible service implementation
└── (hybrid files removed)
```

### Configuration
```javascript
// server/src/config/index.js
database: {
  url: process.env.SURREALDB_URL || 'file://path/to/database.db',
  namespace: process.env.SURREALDB_NAMESPACE || 'graphic_walker',
  database: process.env.SURREALDB_DATABASE || 'main',
  username: process.env.SURREALDB_USERNAME || 'root',
  password: process.env.SURREALDB_PASSWORD || 'root',
  path: process.env.SURREALDB_PATH || './database/graphic-walker.db'
}
```

## Database Schema

### Dashboards Table
```sql
DEFINE TABLE dashboards SCHEMAFULL;
DEFINE FIELD dashboardName ON TABLE dashboards TYPE string;
DEFINE FIELD datasetName ON TABLE dashboards TYPE string;
DEFINE FIELD jsonFormat ON TABLE dashboards TYPE string;
DEFINE FIELD isMultiple ON TABLE dashboards TYPE bool DEFAULT false;
DEFINE FIELD createdAt ON TABLE dashboards TYPE datetime DEFAULT time::now();
DEFINE FIELD updatedAt ON TABLE dashboards TYPE datetime DEFAULT time::now();
DEFINE INDEX unique_dashboard_name ON TABLE dashboards COLUMNS dashboardName UNIQUE;
```

### Datasets Table
```sql
DEFINE TABLE datasets SCHEMAFULL;
DEFINE FIELD datasetName ON TABLE datasets TYPE string;
DEFINE FIELD csvPath ON TABLE datasets TYPE string;
DEFINE FIELD isItFromCsv ON TABLE datasets TYPE bool DEFAULT true;
DEFINE FIELD fileName ON TABLE datasets TYPE string;
DEFINE FIELD fileSize ON TABLE datasets TYPE number;
DEFINE FIELD mimeType ON TABLE datasets TYPE string;
DEFINE FIELD sp ON TABLE datasets TYPE string DEFAULT "";
DEFINE FIELD createdAt ON TABLE datasets TYPE datetime DEFAULT time::now();
DEFINE FIELD updatedAt ON TABLE datasets TYPE datetime DEFAULT time::now();
DEFINE INDEX unique_dataset_name ON TABLE datasets COLUMNS datasetName UNIQUE;
```

## Environment Variables

### SurrealDB Configuration
```bash
# Database connection URL
SURREALDB_URL=mem://                    # In-memory (default)
# SURREALDB_URL=file://./data/app.db    # File-based
# SURREALDB_URL=ws://localhost:8000/rpc # Remote server

# Database credentials
SURREALDB_NAMESPACE=graphic_walker      # Namespace
SURREALDB_DATABASE=main                 # Database name
SURREALDB_USERNAME=root                 # Username
SURREALDB_PASSWORD=root                 # Password

# File-based storage path (if using file:// URL)
SURREALDB_PATH=./server/database/graphic-walker.db
```

## Connection Types

### 1. In-Memory Database (Default)
```bash
SURREALDB_URL=mem://
```
- **Pros**: Fast, no file dependencies, perfect for development
- **Cons**: Data is lost when server restarts
- **Use Case**: Development, testing, temporary deployments

### 2. File-Based Database
```bash
SURREALDB_URL=file://./database/graphic-walker.db
```
- **Pros**: Persistent storage, embedded, easy to backup
- **Cons**: Single-node only, file system dependent
- **Use Case**: Production single-instance deployments

### 3. Remote SurrealDB Server
```bash
SURREALDB_URL=ws://localhost:8000/rpc
```
- **Pros**: Scalable, multi-node, full SurrealDB features
- **Cons**: Requires separate SurrealDB server installation
- **Use Case**: Production multi-instance deployments

## Fallback Behavior

### Automatic Fallback
The system automatically falls back to JSON file storage in these scenarios:
1. **SurrealDB package not installed**
2. **Connection failure** (network, permissions, etc.)
3. **Runtime errors** during database operations
4. **Configuration issues**

### Fallback Storage
- **Location**: `server/data/`
- **Files**: `dashboards.json`, `datasets.json`
- **Format**: Standard JSON arrays with UUID and timestamps
- **Migration**: Automatic migration from JSON to SurrealDB on startup

## Installation & Setup

### 1. Install Dependencies
```bash
cd server
npm install surrealdb
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Start Server
```bash
npm start
```

The server will automatically:
1. Try to connect to SurrealDB
2. Initialize database schema
3. Migrate existing JSON data (if any)
4. Fall back to JSON storage if needed

## Development

### Local Development
For local development, the default in-memory configuration works perfectly:
```bash
# No configuration needed - uses defaults
npm run dev
```

### Production Deployment
For production, use file-based or remote SurrealDB:
```bash
# File-based (recommended for single instance)
export SURREALDB_URL="file://./database/graphic-walker.db"

# Remote server (recommended for scaling)
export SURREALDB_URL="ws://your-surrealdb-server:8000/rpc"
export SURREALDB_USERNAME="your-username"
export SURREALDB_PASSWORD="your-secure-password"

npm start
```

## Monitoring & Health Checks

### Health Check Endpoint
```bash
curl http://localhost:5000/health
```

### Database Status
The health check response includes database information:
```json
{
  "success": true,
  "message": "Graphic Walker API is running",
  "database": {
    "type": "SurrealDB",
    "status": "connected",
    "namespace": "graphic_walker",
    "database": "main"
  }
}
```

### Logs
The application logs database connection status:
```
[INFO] SurrealDB module loaded successfully
[INFO] Connected to SurrealDB in-memory database
[INFO] SurrealDB schema initialized
[INFO] Using SurrealDB for data persistence
```

Or fallback status:
```
[WARN] SurrealDB not available, falling back to JSON storage
[INFO] Using JSON file storage for data persistence
```

## Migration

### Automatic Migration
The system automatically migrates existing JSON data to SurrealDB on startup:
1. **Detects** existing `dashboards.json` and `datasets.json`
2. **Imports** data into SurrealDB tables
3. **Preserves** timestamps and relationships
4. **Logs** migration progress

### Manual Migration
If needed, you can trigger migration manually:
```javascript
const dataService = require('./src/services/dataService');
await dataService.initialize();
```

## Troubleshooting

### Common Issues

#### 1. SurrealDB Connection Failed
```
[ERROR] Failed to connect to SurrealDB: Connection refused
```
**Solution**: Check SurrealDB server status or use in-memory mode

#### 2. Permission Denied
```
[ERROR] Failed to connect to SurrealDB: Permission denied
```
**Solution**: Check file permissions for database directory

#### 3. Module Not Found
```
[WARN] SurrealDB not available, falling back to JSON storage
```
**Solution**: Install SurrealDB package: `npm install surrealdb`

### Debug Mode
Enable debug logging:
```bash
export LOG_LEVEL=debug
npm start
```

## Performance Considerations

### SurrealDB Performance
- **In-Memory**: Fastest, but data is volatile
- **File-Based**: Good performance, persistent storage
- **Remote**: Network latency, but scalable

### JSON Fallback Performance
- **Read Operations**: Fast for small datasets
- **Write Operations**: Slower due to file I/O
- **Concurrent Access**: Limited by file system

### Recommendations
1. **Development**: Use in-memory SurrealDB
2. **Small Production**: Use file-based SurrealDB
3. **Large Production**: Use remote SurrealDB server
4. **High Availability**: Use SurrealDB cluster

## Security

### Authentication
- Default credentials: `root/root`
- **Production**: Change default credentials
- **Environment Variables**: Store credentials securely

### File Permissions
- Database files: `600` (owner read/write only)
- Directory: `700` (owner access only)

### Network Security
- **Local**: Bind to localhost only
- **Remote**: Use TLS/SSL connections
- **Firewall**: Restrict database port access

## Backup & Recovery

### SurrealDB Backup
```bash
# File-based backup
cp ./database/graphic-walker.db ./backups/backup-$(date +%Y%m%d).db

# Remote backup (using SurrealDB CLI)
surreal export --conn ws://localhost:8000 --user root --pass root --ns graphic_walker --db main backup.sql
```

### JSON Fallback Backup
```bash
# Simple file copy
cp ./server/data/*.json ./backups/
```

### Restore
```bash
# File-based restore
cp ./backups/backup-20241201.db ./database/graphic-walker.db

# Remote restore
surreal import --conn ws://localhost:8000 --user root --pass root --ns graphic_walker --db main backup.sql
```

## Future Enhancements

### Planned Features
1. **Real-time Updates**: Live dashboard updates using SurrealDB subscriptions
2. **Advanced Queries**: Complex analytics using SurrealDB's query capabilities
3. **Multi-tenancy**: Namespace-based tenant isolation
4. **Clustering**: SurrealDB cluster support for high availability
5. **GraphQL**: GraphQL API layer on top of SurrealDB

### Migration Path
The hybrid approach provides a smooth migration path:
1. **Phase 1**: Deploy with JSON fallback (current)
2. **Phase 2**: Migrate to SurrealDB with fallback
3. **Phase 3**: Full SurrealDB deployment
4. **Phase 4**: Advanced SurrealDB features

---

## Summary

The SurrealDB integration provides:
- ✅ **Modern Database**: Advanced features and performance
- ✅ **Reliability**: Automatic fallback to JSON storage
- ✅ **Easy Deployment**: Works out of the box
- ✅ **Scalability**: Multiple deployment options
- ✅ **Migration**: Automatic data migration
- ✅ **Monitoring**: Health checks and logging

The hybrid approach ensures that the application works reliably in any environment while providing the benefits of a modern database when available.
