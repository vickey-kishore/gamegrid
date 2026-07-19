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
    private final AuctionTeamRepository auctionTeamRepository;

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

            List<String> validCategories = new ArrayList<>();
            if (auction.getRosterRules() != null) {
                for (RosterRule rule : auction.getRosterRules()) {
                    if (rule.getCategory() != null) {
                        validCategories.add(rule.getCategory().replaceAll("\\s+", " ").trim());
                    }
                }
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
                String category = getCellValue(row, headerMap.get("category")).replaceAll("\\s+", " ").trim();
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

                // Check category matching
                String matchedCategory = null;
                for (String validCat : validCategories) {
                    if (validCat.equalsIgnoreCase(category)) {
                        matchedCategory = validCat;
                        break;
                    }
                }

                if (matchedCategory == null) {
                    failedRecords++;
                    errors.add("Row " + rowNum + " failed: Category '" + category + "' is not configured in the roster rules for this auction. Valid categories: " + String.join(", ", validCategories));
                    continue;
                }

                category = matchedCategory;

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

                // Resolve existing registration in this specific auction
                AuctionPlayer existingAP = auctionPlayerRepository.findByAuctionIdAndPlayerPhoneNumber(auctionId, phone).orElse(null);
                Player player;

                if (existingAP == null) {
                    // Create new player specifically for this auction
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

                    AuctionPlayer ap = AuctionPlayer.builder()
                            .auction(auction)
                            .player(player)
                            .basePrice(auction.getMinimumBid())
                            .status(PlayerStatus.Available)
                            .build();
                    auctionPlayerRepository.save(ap);
                } else {
                    // Update existing player details specifically for this auction
                    player = existingAP.getPlayer();
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
        Player player;

        if (auctionId != null) {
            Auction auction = auctionRepository.findActiveById(auctionId)
                    .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + auctionId));

            // Validate category
            List<String> validCategories = new ArrayList<>();
            if (auction.getRosterRules() != null) {
                for (RosterRule rule : auction.getRosterRules()) {
                    if (rule.getCategory() != null) {
                        validCategories.add(rule.getCategory().replaceAll("\\s+", " ").trim());
                    }
                }
            }

            String matchedCategory = null;
            if (request.getCategory() != null) {
                String normalizedReqCat = request.getCategory().replaceAll("\\s+", " ").trim();
                for (String validCat : validCategories) {
                    if (validCat.equalsIgnoreCase(normalizedReqCat)) {
                        matchedCategory = validCat;
                        break;
                    }
                }
            }

            if (matchedCategory == null && !validCategories.isEmpty()) {
                throw new IllegalArgumentException("Category '" + request.getCategory() + "' is not configured in the roster rules for this auction. Valid categories: " + String.join(", ", validCategories));
            }

            String finalCategory = (matchedCategory != null) ? matchedCategory : request.getCategory();

            AuctionPlayer existingAP = auctionPlayerRepository.findByAuctionIdAndPlayerPhoneNumber(auctionId, request.getPhoneNumber().trim()).orElse(null);
            
            if (existingAP != null) {
                player = existingAP.getPlayer();
                player.setName(request.getName());
                player.setPhoneNumber(request.getPhoneNumber().trim());
                if (request.getEmail() != null) player.setEmail(request.getEmail());
                player.setCategory(finalCategory);
                player.setGender(request.getGender() != null ? request.getGender() : finalCategory);
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
                        .gender(request.getGender() != null ? request.getGender() : finalCategory)
                        .age(request.getAge())
                        .category(finalCategory)
                        .city(request.getCity())
                        .state(request.getState())
                        .skillLevel(request.getSkillLevel())
                        .photoPath(processPhotoPath(request.getPhotoPath()))
                        .club(request.getClub())
                        .build();
                player = playerRepository.save(player);

                AuctionPlayer ap = AuctionPlayer.builder()
                        .auction(auction)
                        .player(player)
                        .basePrice(auction.getMinimumBid())
                        .status(PlayerStatus.Available)
                        .build();
                auctionPlayerRepository.save(ap);
            }
        } else {
            Optional<Player> existingPhone = playerRepository.findByPhoneNumber(request.getPhoneNumber().trim());
            if (existingPhone.isPresent()) {
                player = existingPhone.get();
                player.setName(request.getName());
                player.setPhoneNumber(request.getPhoneNumber().trim());
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

    @Transactional
    public void retainPlayer(Long auctionId, Long playerId, Long teamId, BigDecimal retentionPrice) {
        AuctionPlayer ap = auctionPlayerRepository.findByAuctionIdAndPlayerId(auctionId, playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player not registered in this auction"));

        Auction auction = ap.getAuction();
        if (!auction.isAllowRetention()) {
            throw new IllegalArgumentException("Retention is not enabled for this auction.");
        }

        AuctionTeam team = auctionTeamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found with ID: " + teamId));

        if (!team.getAuction().getId().equals(auctionId)) {
            throw new IllegalArgumentException("Team does not belong to this auction.");
        }

        if (team.getRemainingPurse().compareTo(retentionPrice) < 0) {
            throw new IllegalArgumentException("Team does not have enough purse to retain this player.");
        }

        // Count current retained players for this team
        long currentTeamRetained = auctionPlayerRepository.findByTeamId(teamId).stream()
                .filter(p -> p.isRetained())
                .count();

        if (auction.getMaxRetainedPlayers() != null && auction.getMaxRetainedPlayers() > 0 && currentTeamRetained >= auction.getMaxRetainedPlayers()) {
            throw new IllegalArgumentException("Team has already reached the maximum retention limit of " + auction.getMaxRetainedPlayers() + " player(s).");
        }

        // Check category limit
        String category = ap.getPlayer().getCategory();
        if (category != null && auction.getRosterRules() != null) {
            String normCategory = category.replaceAll("\\s+", " ").trim();
            Optional<RosterRule> ruleOpt = auction.getRosterRules().stream()
                    .filter(r -> r.getCategory() != null && r.getCategory().replaceAll("\\s+", " ").trim().equalsIgnoreCase(normCategory))
                    .findFirst();

            if (ruleOpt.isPresent()) {
                RosterRule rule = ruleOpt.get();
                if (rule.getMaxRetentionLimit() > 0) {
                    long currentCategoryRetained = auctionPlayerRepository.findByTeamId(teamId).stream()
                            .filter(p -> p.isRetained() && p.getPlayer().getCategory() != null && p.getPlayer().getCategory().replaceAll("\\s+", " ").trim().equalsIgnoreCase(normCategory))
                            .count();
                    if (currentCategoryRetained >= rule.getMaxRetentionLimit()) {
                        throw new IllegalArgumentException("Team has already reached the retention limit of " + rule.getMaxRetentionLimit() + " player(s) for category " + rule.getCategory() + ".");
                    }
                }
            }
        }

        // Set status and deduct purse
        ap.setStatus(PlayerStatus.Sold);
        ap.setSoldPrice(retentionPrice);
        ap.setTeam(team);
        ap.setRetained(true);
        ap.setSoldAt(java.time.LocalDateTime.now());

        team.setRemainingPurse(team.getRemainingPurse().subtract(retentionPrice));

        auctionPlayerRepository.save(ap);
        auctionTeamRepository.save(team);
    }

    @Transactional
    public void releaseRetainedPlayer(Long auctionId, Long playerId) {
        AuctionPlayer ap = auctionPlayerRepository.findByAuctionIdAndPlayerId(auctionId, playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player not registered in this auction"));

        if (!ap.isRetained()) {
            throw new IllegalArgumentException("Player is not a retained player.");
        }

        AuctionTeam team = ap.getTeam();
        if (team != null) {
            team.setRemainingPurse(team.getRemainingPurse().add(ap.getSoldPrice()));
            auctionTeamRepository.save(team);
        }

        ap.setStatus(PlayerStatus.Available);
        ap.setSoldPrice(null);
        ap.setTeam(null);
        ap.setRetained(false);
        ap.setSoldAt(null);

        auctionPlayerRepository.save(ap);
    }

    @Transactional
    public void bidAgain(Long auctionId, Long playerId) {
        AuctionPlayer ap = auctionPlayerRepository.findByAuctionIdAndPlayerId(auctionId, playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player not registered in this auction"));

        if (ap.getStatus() != PlayerStatus.Unsold) {
            throw new IllegalArgumentException("Player is not in Unsold status.");
        }

        // Change status back to Available
        ap.setStatus(PlayerStatus.Available);
        ap.setSoldPrice(null);
        ap.setTeam(null);
        ap.setSoldAt(null);

        auctionPlayerRepository.save(ap);
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
