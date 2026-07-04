# GameGrid Tournament Auction Module - Backend

This is the Spring Boot backend engine powering the tournament bidding board for GameGrid.

## Tech Stack
* **Runtime**: Java 17
* **Framework**: Spring Boot 3.2.5
* **Build System**: Maven
* **Database**: MySQL 8.x
* **Migrations**: Flyway
* **API Documentation**: Springdoc OpenAPI (Swagger UI)

---

## Getting Started

### 1. Database Setup
Ensure you have a local MySQL instance running and create a database named `tournament_db`:
```sql
CREATE DATABASE tournament_db;
```

### 2. Configure Credentials
Review or modify credentials inside `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/tournament_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=your_password
```

### 3. Run Application
Run the boot app directly using Maven:
```bash
mvn spring-boot:run
```
Flyway will automatically execute all migration scripts on startup and the server will launch on port `8084`.

* **Swagger API UI**: Open [http://localhost:8084/swagger-ui/index.html](http://localhost:8084/swagger-ui/index.html) in your browser.

---

## Testing
Run unit tests (bidding rules validation) and integration tests (H2 database simulation) using:
```bash
mvn clean test
```

---

## API Endpoints List

### Players
* `POST /api/players/import` - Upload and parse `.xlsx` player sheets.
* `GET /api/players` - Query registered players database with search, category filtering, and paging.
* `GET /api/players/{id}` - Fetch single player details.

### Auctions
* `POST /api/auctions` - Setup details, rules, and team list configurations (Draft status).
* `GET /api/auctions` - List campaigns (paged, searchable, status filterable).
* `GET /api/auctions/{id}` - Retrieve config metadata.
* `PUT /api/auctions/{id}` - Update draft settings.
* `DELETE /api/auctions/{id}` - Cancel and soft-delete an auction.
* `POST /api/auctions/{id}/start` - Launch draft auction, import category players, and set status to Active.
* `GET /api/auctions/{id}/players` - Fetch player pool inside an auction (search, category, status).

### Teams
* `POST /api/auctions/{id}/teams` - Configure and register a team to an auction.
* `GET /api/auctions/{id}/teams` - List teams registered in an auction.
* `GET /api/teams/{id}/roster` - Fetch active roster, budgets spent/remaining.
* `GET /api/teams/{id}/roster/export` - Generate and download POI Excel roster worksheet.

### Bidding
* `POST /api/bids` - Submit team bids (synchronous pessimistic database lock protected).
* `GET /api/bids/auction/{auctionId}/player/{playerId}` - List bid logs history.
* `POST /api/players/{id}/sold` - Mark current player as Sold to winning team.
* `POST /api/players/{id}/unsold` - Mark current player as Unsold.

### File Storage
* `POST /api/files/upload` - Save multipart files (player photos or team logos) locally.
