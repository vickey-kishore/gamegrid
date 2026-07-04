package com.gamegrid.auction.service;

import lombok.RequiredArgsConstructor;
import com.gamegrid.auction.dto.PlayerImportResult;
import com.gamegrid.auction.entity.*;
import com.gamegrid.auction.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.criteria.Predicate;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionPlayerRepository auctionPlayerRepository;

    @Transactional
    public PlayerImportResult importPlayers(MultipartFile file) {
        PlayerImportResult result = new PlayerImportResult();
        List<String> errors = new ArrayList<>();
        int successfullyImported = 0;
        int duplicateRecords = 0;
        int failedRecords = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            if (!rows.hasNext()) {
                errors.add("The Excel file is empty.");
                result.setErrors(errors);
                return result;
            }

            // Parse header row
            Row headerRow = rows.next();
            Map<String, Integer> headerMap = parseHeaders(headerRow);

            // Validate header presence
            List<String> missingHeaders = new ArrayList<>();
            if (!headerMap.containsKey("name")) missingHeaders.add("Name");
            if (!headerMap.containsKey("phone")) missingHeaders.add("Phone Number");
            if (!headerMap.containsKey("category")) missingHeaders.add("Category");

            if (!missingHeaders.isEmpty()) {
                errors.add("Missing required columns: " + String.join(", ", missingHeaders));
                result.setErrors(errors);
                result.setFailedRecords(1);
                return result;
            }

            int rowNum = 1;
            Set<String> encounteredPhonesInSheet = new HashSet<>();
            Set<String> encounteredEmailsInSheet = new HashSet<>();

            while (rows.hasNext()) {
                rowNum++;
                Row row = rows.next();
                if (isRowEmpty(row)) {
                    continue; // Skip empty rows
                }

                result.setTotalRows(result.getTotalRows() + 1);

                String name = getCellValue(row, headerMap.get("name"));
                String phone = getCellValue(row, headerMap.get("phone"));
                String email = getCellValue(row, headerMap.get("email"));
                String gender = getCellValue(row, headerMap.get("gender"));
                String ageStr = getCellValue(row, headerMap.get("age"));
                String category = getCellValue(row, headerMap.get("category"));
                String city = getCellValue(row, headerMap.get("city"));
                String state = getCellValue(row, headerMap.get("state"));
                String skillLevel = getCellValue(row, headerMap.get("skill"));
                String photo = getCellValue(row, headerMap.get("photo"));
                String club = getCellValue(row, headerMap.get("club"));

                // Validation
                if (name.isEmpty() || phone.isEmpty() || category.isEmpty()) {
                    failedRecords++;
                    errors.add("Row " + rowNum + " failed: 'Name', 'Phone Number', and 'Category' are required.");
                    continue;
                }

                Integer age = null;
                if (!ageStr.isEmpty()) {
                    try {
                        age = (int) Double.parseDouble(ageStr);
                    } catch (NumberFormatException eloquence) {
                        failedRecords++;
                        errors.add("Row " + rowNum + " failed: Invalid age format '" + ageStr + "'.");
                        continue;
                    }
                }

                // Check duplicate within the sheet or database
                boolean isDuplicate = false;
                if (encounteredPhonesInSheet.contains(phone) || playerRepository.existsByPhoneNumber(phone)) {
                    isDuplicate = true;
                }
                if (!email.isEmpty() && (encounteredEmailsInSheet.contains(email) || playerRepository.existsByEmail(email))) {
                    isDuplicate = true;
                }

                if (isDuplicate) {
                    duplicateRecords++;
                    continue; // Skip duplicate records
                }

                // Add to sheet validation tracking
                encounteredPhonesInSheet.add(phone);
                if (!email.isEmpty()) {
                    encounteredEmailsInSheet.add(email);
                }

                // Save Player
                Player player = Player.builder()
                        .name(name)
                        .phoneNumber(phone)
                        .email(email.isEmpty() ? null : email)
                        .gender(gender.isEmpty() ? category : gender)
                        .age(age)
                        .category(category)
                        .city(city.isEmpty() ? null : city)
                        .state(state.isEmpty() ? null : state)
                        .skillLevel(skillLevel.isEmpty() ? null : skillLevel)
                        .photoPath(processPhotoPath(photo))
                        .club(club.isEmpty() ? null : club)
                        .build();

                playerRepository.save(player);
                successfullyImported++;
            }

        } catch (Exception eloquence) {
            errors.add("Error processing Excel file: " + eloquence.getMessage());
            result.setErrors(errors);
        }

        result.setSuccessfullyImported(successfullyImported);
        result.setDuplicateRecords(duplicateRecords);
        result.setFailedRecords(failedRecords);
        result.setErrors(errors);
        return result;
    }

    private Map<String, Integer> parseHeaders(Row headerRow) {
        Map<String, Integer> map = new HashMap<>();
        for (Cell cell : headerRow) {
            String val = cell.getStringCellValue().trim().toLowerCase();
            if (val.contains("name")) {
                map.put("name", cell.getColumnIndex());
            } else if (val.contains("phone") || val.contains("number") || val.contains("contact")) {
                map.put("phone", cell.getColumnIndex());
            } else if (val.contains("email")) {
                map.put("email", cell.getColumnIndex());
            } else if (val.contains("gender") || val.contains("sex")) {
                map.put("gender", cell.getColumnIndex());
            } else if (val.contains("age")) {
                map.put("age", cell.getColumnIndex());
            } else if (val.contains("category")) {
                map.put("category", cell.getColumnIndex());
            } else if (val.contains("city")) {
                map.put("city", cell.getColumnIndex());
            } else if (val.contains("state")) {
                map.put("state", cell.getColumnIndex());
            } else if (val.contains("skill")) {
                map.put("skill", cell.getColumnIndex());
            } else if (val.contains("photo") || val.contains("image") || val.contains("profile") || val.contains("drive")) {
                map.put("photo", cell.getColumnIndex());
            } else if (val.contains("club") || val.contains("team")) {
                map.put("club", cell.getColumnIndex());
            }
        }
        return map;
    }

    private String getCellValue(Row row, Integer colIndex) {
        if (colIndex == null) return "";
        Cell cell = row.getCell(colIndex);
        if (cell == null) return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                return BigDecimal.valueOf(cell.getNumericCellValue()).toPlainString().replaceAll("\\.0+$", "");
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK && !getCellValue(row, c).isEmpty()) {
                return false;
            }
        }
        return true;
    }

    public Page<Player> getPlayers(String search, String category, String skillLevel, Pageable pageable) {
        Specification<Player> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("phoneNumber")), searchPattern),
                        cb.like(cb.lower(root.get("email")), searchPattern)
                ));
            }

            if (category != null && !category.isEmpty()) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (skillLevel != null && !skillLevel.isEmpty()) {
                predicates.add(cb.equal(root.get("skillLevel"), skillLevel));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return playerRepository.findAll(spec, pageable);
    }

    public Optional<Player> getPlayerById(Long id) {
        return playerRepository.findById(id);
    }

    @Transactional
    public PlayerImportResult importPlayersForAuction(Long auctionId, MultipartFile file) {
        Auction auction = auctionRepository.findActiveById(auctionId)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + auctionId));

        PlayerImportResult result = new PlayerImportResult();
        List<String> errors = new ArrayList<>();
        int successfullyImported = 0;
        int duplicateRecords = 0;
        int failedRecords = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            if (!rows.hasNext()) {
                errors.add("The Excel file is empty.");
                result.setErrors(errors);
                return result;
            }

            // Parse header row
            Row headerRow = rows.next();
            Map<String, Integer> headerMap = parseHeaders(headerRow);

            // Validate header presence
            List<String> missingHeaders = new ArrayList<>();
            if (!headerMap.containsKey("name")) missingHeaders.add("Name");
            if (!headerMap.containsKey("phone")) missingHeaders.add("Phone Number");
            if (!headerMap.containsKey("category")) missingHeaders.add("Category");

            if (!missingHeaders.isEmpty()) {
                errors.add("Missing required columns: " + String.join(", ", missingHeaders));
                result.setErrors(errors);
                result.setFailedRecords(1);
                return result;
            }

            int rowNum = 1;

            while (rows.hasNext()) {
                rowNum++;
                Row row = rows.next();
                if (isRowEmpty(row)) {
                    continue; // Skip empty rows
                }

                result.setTotalRows(result.getTotalRows() + 1);

                String name = getCellValue(row, headerMap.get("name"));
                String phone = getCellValue(row, headerMap.get("phone"));
                String email = getCellValue(row, headerMap.get("email"));
                String gender = getCellValue(row, headerMap.get("gender"));
                String ageStr = getCellValue(row, headerMap.get("age"));
                String category = getCellValue(row, headerMap.get("category"));
                String city = getCellValue(row, headerMap.get("city"));
                String state = getCellValue(row, headerMap.get("state"));
                String skillLevel = getCellValue(row, headerMap.get("skill"));
                String photo = getCellValue(row, headerMap.get("photo"));
                String club = getCellValue(row, headerMap.get("club"));

                // Validation
                if (name.isEmpty() || phone.isEmpty() || category.isEmpty()) {
                    failedRecords++;
                    errors.add("Row " + rowNum + " failed: 'Name', 'Phone Number', and 'Category' are required.");
                    continue;
                }

                Integer age = null;
                if (!ageStr.isEmpty()) {
                    try {
                        age = (int) Double.parseDouble(ageStr);
                    } catch (NumberFormatException eloquence) {
                        failedRecords++;
                        errors.add("Row " + rowNum + " failed: Invalid age format '" + ageStr + "'.");
                        continue;
                    }
                }

                // Check duplicate or find existing
                Player player = playerRepository.findByPhoneNumber(phone).orElse(null);
                if (player == null && !email.isEmpty()) {
                    player = playerRepository.findByEmail(email).orElse(null);
                }

                if (player == null) {
                    // Create new player
                    player = Player.builder()
                            .name(name)
                            .phoneNumber(phone)
                            .email(email.isEmpty() ? null : email)
                            .gender(gender.isEmpty() ? category : gender)
                            .age(age)
                            .category(category)
                            .city(city.isEmpty() ? null : city)
                            .state(state.isEmpty() ? null : state)
                            .skillLevel(skillLevel.isEmpty() ? null : skillLevel)
                            .photoPath(processPhotoPath(photo))
                            .club(club.isEmpty() ? null : club)
                            .build();

                    player = playerRepository.save(player);
                    successfullyImported++;
                } else {
                    // Update existing player details with sheet info
                    player.setName(name);
                    if (!email.isEmpty()) player.setEmail(email);
                    if (!category.isEmpty()) player.setCategory(category);
                    if (!gender.isEmpty()) player.setGender(gender);
                    if (age != null) player.setAge(age);
                    if (!city.isEmpty()) player.setCity(city);
                    if (!state.isEmpty()) player.setState(state);
                    if (!skillLevel.isEmpty()) player.setSkillLevel(skillLevel);
                    String processedPhoto = processPhotoPath(photo);
                    if (processedPhoto != null) player.setPhotoPath(processedPhoto);
                    if (!club.isEmpty()) player.setClub(club);

                    player = playerRepository.save(player);
                    duplicateRecords++;
                }

                // Register to this auction
                Optional<AuctionPlayer> existingAP = auctionPlayerRepository.findByAuctionIdAndPlayerId(auctionId, player.getId());
                if (existingAP.isEmpty()) {
                    AuctionPlayer ap = AuctionPlayer.builder()
                            .auction(auction)
                            .player(player)
                            .basePrice(auction.getMinimumBid())
                            .status(PlayerStatus.Available)
                            .build();
                    auctionPlayerRepository.save(ap);
                }
            }

        } catch (Exception eloquence) {
            errors.add("Error processing Excel file: " + eloquence.getMessage());
            result.setErrors(errors);
        }

        result.setSuccessfullyImported(successfullyImported);
        result.setDuplicateRecords(duplicateRecords);
        result.setFailedRecords(failedRecords);
        result.setErrors(errors);
        return result;
    }

    @Transactional
    public Player createPlayer(com.gamegrid.auction.dto.PlayerRequest request, Long auctionId) {
        Optional<Player> existingPhone = playerRepository.findByPhoneNumber(request.getPhoneNumber().trim());
        Player player;

        if (existingPhone.isPresent()) {
            player = existingPhone.get();
            player.setName(request.getName());
            if (request.getEmail() != null) player.setEmail(request.getEmail());
            player.setCategory(request.getCategory());
            player.setGender(request.getGender() != null ? request.getGender() : request.getCategory());
            if (request.getAge() != null) player.setAge(request.getAge());
            if (request.getCity() != null) player.setCity(request.getCity());
            if (request.getState() != null) player.setState(request.getState());
            if (request.getSkillLevel() != null) player.setSkillLevel(request.getSkillLevel());
            if (request.getPhotoPath() != null) player.setPhotoPath(processPhotoPath(request.getPhotoPath()));
            if (request.getClub() != null) player.setClub(request.getClub());
            player = playerRepository.save(player);
        } else {
            player = Player.builder()
                    .name(request.getName())
                    .phoneNumber(request.getPhoneNumber().trim())
                    .email(request.getEmail())
                    .gender(request.getGender() != null ? request.getGender() : request.getCategory())
                    .age(request.getAge())
                    .category(request.getCategory())
                    .city(request.getCity())
                    .state(request.getState())
                    .skillLevel(request.getSkillLevel())
                    .photoPath(processPhotoPath(request.getPhotoPath()))
                    .club(request.getClub())
                    .build();
            player = playerRepository.save(player);
        }

        if (auctionId != null) {
            Auction auction = auctionRepository.findActiveById(auctionId)
                    .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + auctionId));
            
            Optional<AuctionPlayer> existingAP = auctionPlayerRepository.findByAuctionIdAndPlayerId(auctionId, player.getId());
            if (existingAP.isEmpty()) {
                AuctionPlayer ap = AuctionPlayer.builder()
                        .auction(auction)
                        .player(player)
                        .basePrice(auction.getMinimumBid())
                        .status(PlayerStatus.Available)
                        .build();
                auctionPlayerRepository.save(ap);
            }
        }

        return player;
    }

    @Transactional
    public Player updatePlayer(Long id, com.gamegrid.auction.dto.PlayerRequest request) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Player not found with ID: " + id));

        player.setName(request.getName());
        player.setPhoneNumber(request.getPhoneNumber().trim());
        player.setEmail(request.getEmail());
        player.setCategory(request.getCategory());
        player.setGender(request.getGender() != null ? request.getGender() : request.getCategory());
        player.setAge(request.getAge());
        player.setCity(request.getCity());
        player.setState(request.getState());
        player.setSkillLevel(request.getSkillLevel());
        player.setPhotoPath(processPhotoPath(request.getPhotoPath()));
        player.setClub(request.getClub());
 
        return playerRepository.save(player);
    }

    @Transactional
    public void removePlayerFromAuction(Long auctionId, Long playerId) {
        AuctionPlayer ap = auctionPlayerRepository.findByAuctionIdAndPlayerId(auctionId, playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player not registered in this auction"));
        auctionPlayerRepository.delete(ap);
    }

    private String processPhotoPath(String photo) {
        if (photo == null || photo.trim().isEmpty()) {
            return null;
        }
        String trimmed = photo.trim();
        if (trimmed.contains("drive.google.com")) {
            // Extract ID
            // Matches e.g. open?id=FILE_ID or /d/FILE_ID/view
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(?:id=|d/|open\\?id=)([a-zA-Z0-9_-]{25,})");
            java.util.regex.Matcher matcher = pattern.matcher(trimmed);
            if (matcher.find()) {
                String fileId = matcher.group(1);
                return "https://lh3.googleusercontent.com/d/" + fileId;
            }
        }
        return trimmed;
    }
}
