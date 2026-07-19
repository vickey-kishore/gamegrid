package com.gamegrid.auction.service;

import com.gamegrid.auction.dto.RosterPlayerDto;
import com.gamegrid.auction.dto.TeamConfig;
import com.gamegrid.auction.dto.TeamRosterDto;
import com.gamegrid.auction.entity.*;
import com.gamegrid.auction.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final AuctionTeamRepository auctionTeamRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionPlayerRepository auctionPlayerRepository;

    @Transactional
    public TeamConfig addTeamToAuction(Long auctionId, TeamConfig config) {
        Auction auction = auctionRepository.findActiveById(auctionId)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + auctionId));

        if (auction.getStatus() != AuctionStatus.Draft) {
            throw new IllegalStateException("Cannot add teams to an auction that is not in Draft status.");
        }

        if (auctionTeamRepository.existsByAuctionIdAndTeamNameIgnoreCase(auctionId, config.getTeamName())) {
            throw new IllegalArgumentException("Team with name '" + config.getTeamName() + "' already exists in this auction.");
        }

        if (config.getPurseAmount().doubleValue() <= 0) {
            throw new IllegalArgumentException("Purse amount must be greater than zero.");
        }

        AuctionTeam team = AuctionTeam.builder()
                .auction(auction)
                .teamName(config.getTeamName())
                .logoPath(config.getLogoPath())
                .purseAmount(config.getPurseAmount())
                .remainingPurse(config.getPurseAmount())
                .minimumPlayers(config.getMinimumPlayers())
                .maximumPlayers(config.getMaximumPlayers() != null ? config.getMaximumPlayers() : 99)
                .build();

        AuctionTeam saved = auctionTeamRepository.save(team);
        return mapToTeamConfig(saved);
    }

    public List<TeamConfig> getTeamsForAuction(Long auctionId) {
        List<AuctionTeam> teams = auctionTeamRepository.findByAuctionId(auctionId);
        return teams.stream().map(this::mapToTeamConfig).collect(Collectors.toList());
    }

    public TeamRosterDto getTeamRoster(Long teamId) {
        AuctionTeam team = auctionTeamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found with ID: " + teamId));

        List<AuctionPlayer> purchasedPlayers = auctionPlayerRepository.findPurchasedPlayersByTeamIdWithPlayerDetails(teamId);

        List<RosterPlayerDto> playerDtos = purchasedPlayers.stream()
                .map(ap -> RosterPlayerDto.builder()
                        .playerId(ap.getPlayer().getId())
                        .name(ap.getPlayer().getName())
                        .photoPath(ap.getPlayer().getPhotoPath())
                        .category(ap.getPlayer().getCategory())
                        .skillLevel(ap.getPlayer().getSkillLevel())
                        .club(ap.getPlayer().getClub())
                        .soldPrice(ap.getSoldPrice())
                        .isRetained(ap.isRetained())
                        .build())
                .sorted((a, b) -> {
                    String catA = a.getCategory() != null ? a.getCategory().trim().toLowerCase() : "";
                    String catB = b.getCategory() != null ? b.getCategory().trim().toLowerCase() : "";
                    int cmp = catA.compareTo(catB);
                    if (cmp != 0) return cmp;
                    String nameA = a.getName() != null ? a.getName().trim().toLowerCase() : "";
                    String nameB = b.getName() != null ? b.getName().trim().toLowerCase() : "";
                    return nameA.compareTo(nameB);
                })
                .collect(Collectors.toList());

        BigDecimal totalSpent = team.getPurseAmount().subtract(team.getRemainingPurse());

        return TeamRosterDto.builder()
                .teamId(team.getId())
                .teamName(team.getTeamName())
                .logoPath(team.getLogoPath())
                .purseAmount(team.getPurseAmount())
                .remainingPurse(team.getRemainingPurse())
                .totalSpent(totalSpent)
                .totalPlayersPurchased(playerDtos.size())
                .players(playerDtos)
                .build();
    }

    public byte[] exportRosterToExcel(Long teamId) throws IOException {
        TeamRosterDto roster = getTeamRoster(teamId);
        AuctionTeam team = auctionTeamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found with ID: " + teamId));
        String auctionName = team.getAuction().getAuctionName();

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Team Roster");

            // Styles
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);

            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Title Row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(auctionName + " - " + roster.getTeamName() + " Roster");
            titleCell.setCellStyle(titleStyle);

            // Metadata Info
            Row metaRow1 = sheet.createRow(2);
            metaRow1.createCell(0).setCellValue("Total Budget (₹):");
            metaRow1.createCell(1).setCellValue(roster.getPurseAmount().doubleValue());
            metaRow1.createCell(3).setCellValue("Remaining Purse (₹):");
            metaRow1.createCell(4).setCellValue(roster.getRemainingPurse().doubleValue());

            Row metaRow2 = sheet.createRow(3);
            metaRow2.createCell(0).setCellValue("Total Spent (₹):");
            metaRow2.createCell(1).setCellValue(roster.getTotalSpent().doubleValue());
            metaRow2.createCell(3).setCellValue("Players Purchased:");
            metaRow2.createCell(4).setCellValue(roster.getTotalPlayersPurchased());

            // Header row
            Row headerRow = sheet.createRow(5);
            String[] headers = {"S.No", "Player ID", "Player Name", "Category", "Club", "Sold Price (₹)"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowIdx = 6;
            int count = 1;
            for (RosterPlayerDto player : roster.getPlayers()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(count++);
                row.createCell(1).setCellValue(player.getPlayerId());
                row.createCell(2).setCellValue(player.getName());
                row.createCell(3).setCellValue(player.getCategory());
                row.createCell(4).setCellValue(player.getClub() != null ? player.getClub() : "—");
                row.createCell(5).setCellValue(player.getSoldPrice().doubleValue());
            }

            // Auto size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private TeamConfig mapToTeamConfig(AuctionTeam team) {
        int count = auctionPlayerRepository.findByTeamId(team.getId()).size();
        return TeamConfig.builder()
                .id(team.getId())
                .teamName(team.getTeamName())
                .logoPath(team.getLogoPath())
                .purseAmount(team.getPurseAmount())
                .remainingPurse(team.getRemainingPurse())
                .playersCount(count)
                .minimumPlayers(team.getMinimumPlayers())
                .maximumPlayers(team.getMaximumPlayers())
                .build();
    }
}
