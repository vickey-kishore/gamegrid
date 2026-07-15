package com.gamegrid.auction.service;

import com.gamegrid.auction.dto.AuctionPlayerResponse;
import com.gamegrid.auction.dto.AuctionRequest;
import com.gamegrid.auction.dto.AuctionResponse;
import com.gamegrid.auction.dto.TeamConfig;
import com.gamegrid.auction.entity.*;
import com.gamegrid.auction.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final AuctionTeamRepository auctionTeamRepository;
    private final AuctionPlayerRepository auctionPlayerRepository;
    private final BidRepository bidRepository;
    private final PlayerRepository playerRepository;

    @Transactional
    public AuctionResponse createAuction(AuctionRequest request) {
        validateAuctionRequest(request);
        String eventName = request.getEventName();
        if (eventName == null || eventName.trim().isEmpty()) {
            eventName = request.getAuctionName();
        }

        Auction auction = Auction.builder()
                .auctionName(request.getAuctionName())
                .eventName(eventName)
                .category(request.getCategory())
                .events(request.getEvents() == null ? null : String.join(",", request.getEvents()))
                .rosterRules(request.getRosterRules() == null ? new java.util.ArrayList<>() : request.getRosterRules())
                .allowRetention(request.isAllowRetention())
                .maxRetainedPlayers(request.getMaxRetainedPlayers() == null ? 0 : request.getMaxRetainedPlayers())
                .auctionDate(request.getAuctionDate())
                .description(request.getDescription())
                .minimumBid(request.getMinimumBid())
                .bidIncrement(request.getBidIncrement())
                .maximumBid(request.getMaximumBid())
                .status(AuctionStatus.Draft)
                .isDeleted(false)
                .build();

        Auction savedAuction = auctionRepository.save(auction);

        List<TeamConfig> savedTeams = new ArrayList<>();
        for (TeamConfig teamConfig : request.getTeams()) {
            AuctionTeam team = AuctionTeam.builder()
                    .auction(savedAuction)
                    .teamName(teamConfig.getTeamName())
                    .logoPath(teamConfig.getLogoPath())
                    .purseAmount(teamConfig.getPurseAmount())
                    .remainingPurse(teamConfig.getPurseAmount())
                    .minimumPlayers(teamConfig.getMinimumPlayers())
                    .maximumPlayers(teamConfig.getMaximumPlayers())
                    .build();
            AuctionTeam savedTeam = auctionTeamRepository.save(team);
            savedTeams.add(mapToTeamConfig(savedTeam));
        }

        return mapToAuctionResponse(savedAuction, savedTeams);
    }

    @Transactional
    public AuctionResponse updateAuction(Long id, AuctionRequest request) {
        Auction auction = auctionRepository.findActiveById(id)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + id));

        if (auction.getStatus() != AuctionStatus.Draft) {
            throw new IllegalStateException("Only Draft auctions can be updated.");
        }

        validateAuctionRequest(request);

        String eventName = request.getEventName();
        if (eventName == null || eventName.trim().isEmpty()) {
            eventName = request.getAuctionName();
        }

        auction.setAuctionName(request.getAuctionName());
        auction.setEventName(eventName);
        auction.setCategory(request.getCategory());
        auction.setEvents(request.getEvents() == null ? null : String.join(",", request.getEvents()));
        auction.setRosterRules(request.getRosterRules() == null ? new java.util.ArrayList<>() : request.getRosterRules());
        auction.setAllowRetention(request.isAllowRetention());
        auction.setMaxRetainedPlayers(request.getMaxRetainedPlayers() == null ? 0 : request.getMaxRetainedPlayers());
        auction.setAuctionDate(request.getAuctionDate());
        auction.setDescription(request.getDescription());
        auction.setMinimumBid(request.getMinimumBid());
        auction.setBidIncrement(request.getBidIncrement());
        auction.setMaximumBid(request.getMaximumBid());

        Auction savedAuction = auctionRepository.save(auction);

        // Update teams in-place to avoid duplicate key issues or breaking references
        List<AuctionTeam> existingTeams = auctionTeamRepository.findByAuctionId(id);
        
        java.util.Map<Long, TeamConfig> requestTeamMap = new java.util.HashMap<>();
        for (TeamConfig tc : request.getTeams()) {
            if (tc.getId() != null) {
                requestTeamMap.put(tc.getId(), tc);
            }
        }

        List<AuctionTeam> teamsToDelete = new java.util.ArrayList<>();
        for (AuctionTeam et : existingTeams) {
            if (!requestTeamMap.containsKey(et.getId())) {
                teamsToDelete.add(et);
            }
        }

        // Delete logos for removed teams
        for (AuctionTeam et : teamsToDelete) {
            if (et.getLogoPath() != null) {
                try {
                    Files.deleteIfExists(Paths.get(et.getLogoPath()));
                } catch (IOException eloquence) {
                    // Ignore
                }
            }
        }
        
        if (!teamsToDelete.isEmpty()) {
            auctionTeamRepository.deleteAll(teamsToDelete);
            auctionTeamRepository.flush();
        }

        List<TeamConfig> savedTeams = new java.util.ArrayList<>();
        for (TeamConfig teamConfig : request.getTeams()) {
            AuctionTeam team;
            if (teamConfig.getId() != null) {
                team = auctionTeamRepository.findById(teamConfig.getId())
                        .orElseThrow(() -> new EntityNotFoundException("Team not found with ID: " + teamConfig.getId()));
                team.setTeamName(teamConfig.getTeamName());
                team.setLogoPath(teamConfig.getLogoPath());
                team.setPurseAmount(teamConfig.getPurseAmount());
                
                // If it is in Draft, update remaining purse to match total purse minus spent purse from retained players
                if (auction.getStatus() == AuctionStatus.Draft) {
                    BigDecimal spentPurse = auctionPlayerRepository.findByTeamId(team.getId()).stream()
                            .filter(ap -> ap.isRetained())
                            .map(ap -> ap.getSoldPrice() != null ? ap.getSoldPrice() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    team.setRemainingPurse(teamConfig.getPurseAmount().subtract(spentPurse));
                }
                
                team.setMinimumPlayers(teamConfig.getMinimumPlayers());
                team.setMaximumPlayers(teamConfig.getMaximumPlayers());
            } else {
                team = AuctionTeam.builder()
                        .auction(savedAuction)
                        .teamName(teamConfig.getTeamName())
                        .logoPath(teamConfig.getLogoPath())
                        .purseAmount(teamConfig.getPurseAmount())
                        .remainingPurse(teamConfig.getPurseAmount())
                        .minimumPlayers(teamConfig.getMinimumPlayers())
                        .maximumPlayers(teamConfig.getMaximumPlayers())
                        .build();
            }
            AuctionTeam savedTeam = auctionTeamRepository.save(team);
            savedTeams.add(mapToTeamConfig(savedTeam));
        }

        return mapToAuctionResponse(savedAuction, savedTeams);
    }

    @Transactional
    public void deleteAuction(Long id) {
        Auction auction = auctionRepository.findActiveById(id)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + id));

        auction.setDeleted(true);
        auction.setStatus(AuctionStatus.Cancelled);
        auctionRepository.save(auction);

        // Clean up and mark related data
        List<AuctionTeam> teams = auctionTeamRepository.findByAuctionId(id);
        for (AuctionTeam team : teams) {
            if (team.getLogoPath() != null) {
                try {
                    Files.deleteIfExists(Paths.get(team.getLogoPath()));
                } catch (IOException eloquence) {
                    // Ignore
                }
            }
        }
        
        // Delete records
        bidRepository.deleteByAuctionId(id);
        
        List<AuctionPlayer> aps = auctionPlayerRepository.findByAuctionId(id);
        auctionPlayerRepository.deleteAll(aps);
        
        auctionTeamRepository.deleteAll(teams);
    }

    @Transactional
    public void publishAuction(Long id) {
        Auction auction = auctionRepository.findActiveById(id)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + id));

        if (auction.getStatus() != AuctionStatus.Draft) {
            throw new IllegalStateException("Only Draft auctions can be published.");
        }

        // Initialize players queue for this category / events
        Specification<Player> spec;
        if (auction.getEvents() != null && !auction.getEvents().isBlank()) {
            List<String> eventList = java.util.Arrays.asList(auction.getEvents().split("\\s*,\\s*"));
            spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                for (String ev : eventList) {
                    predicates.add(cb.equal(cb.lower(root.get("category")), ev.toLowerCase().trim()));
                }
                return cb.or(predicates.toArray(new Predicate[0]));
            };
        } else {
            spec = (root, query, cb) -> 
                cb.equal(cb.lower(root.get("category")), auction.getCategory().toLowerCase());
        }
        
        List<Player> availablePlayers = playerRepository.findAll(spec);

        for (Player player : availablePlayers) {
            Optional<AuctionPlayer> existing = auctionPlayerRepository.findByAuctionIdAndPlayerId(id, player.getId());
            if (existing.isEmpty()) {
                AuctionPlayer ap = AuctionPlayer.builder()
                        .auction(auction)
                        .player(player)
                        .basePrice(auction.getMinimumBid())
                        .status(PlayerStatus.Available)
                        .build();
                auctionPlayerRepository.save(ap);
            }
        }

        // Validate enough registered players before starting
        List<AuctionTeam> teams = auctionTeamRepository.findByAuctionId(id);
        int requiredMinPlayers = teams.stream().mapToInt(AuctionTeam::getMinimumPlayers).sum();

        List<AuctionPlayer> allRegisteredAuctionPlayers = auctionPlayerRepository.findByAuctionId(id);

        if (allRegisteredAuctionPlayers.size() < requiredMinPlayers) {
            String categoryDesc = auction.getEvents() != null ? auction.getEvents() : auction.getCategory();
            throw new IllegalStateException("Cannot publish auction: Not enough registered players in categories '" + categoryDesc 
                    + "'. Required minimum: " + requiredMinPlayers + ", Registered in auction: " + allRegisteredAuctionPlayers.size());
        }

        auction.setStatus(AuctionStatus.Active);
        auctionRepository.save(auction);
    }

    @Transactional
    public void startAuction(Long id) {
        Auction auction = auctionRepository.findActiveById(id)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + id));

        if (auction.getStatus() != AuctionStatus.Active) {
            throw new IllegalStateException("Only Active (published) auctions can be started.");
        }

        auction.setStatus(AuctionStatus.Live);
        auctionRepository.save(auction);
    }

    @Transactional
    public void completeAuction(Long id) {
        Auction auction = auctionRepository.findActiveById(id)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + id));

        if (auction.getStatus() != AuctionStatus.Live) {
            throw new IllegalStateException("Only Live auctions can be completed.");
        }

        auction.setStatus(AuctionStatus.Completed);
        auctionRepository.save(auction);
    }

    public Page<Auction> getAuctions(String search, AuctionStatus status, Pageable pageable) {
        Specification<Auction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("auctionName")), searchPattern),
                        cb.like(cb.lower(root.get("eventName")), searchPattern),
                        cb.like(cb.lower(root.get("category")), searchPattern)
                ));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return auctionRepository.findAll(spec, pageable);
    }

    public AuctionResponse getAuctionById(Long id) {
        Auction auction = auctionRepository.findActiveById(id)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + id));

        List<AuctionTeam> teams = auctionTeamRepository.findByAuctionId(id);
        List<TeamConfig> teamConfigs = teams.stream()
                .map(this::mapToTeamConfig)
                .collect(Collectors.toList());

        return mapToAuctionResponse(auction, teamConfigs);
    }

    private void validateAuctionRequest(AuctionRequest request) {
        if (request.getTeams() == null || request.getTeams().size() < 2) {
            throw new IllegalArgumentException("Number of teams must be at least 2.");
        }

        Set<String> teamNames = new HashSet<>();
        for (TeamConfig tc : request.getTeams()) {
            if (tc.getPurseAmount().doubleValue() <= 0) {
                throw new IllegalArgumentException("Purse amount must be greater than zero for team: " + tc.getTeamName());
            }
            if (tc.getMinimumPlayers() <= 0) {
                throw new IllegalArgumentException("Minimum players must be greater than zero for team: " + tc.getTeamName());
            }
            if (tc.getMaximumPlayers() < tc.getMinimumPlayers()) {
                throw new IllegalArgumentException("Maximum players must be greater than or equal to minimum players for team: " + tc.getTeamName());
            }
            if (!teamNames.add(tc.getTeamName().toLowerCase().trim())) {
                throw new IllegalArgumentException("Team names must be unique within an auction: " + tc.getTeamName());
            }
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

    private AuctionResponse mapToAuctionResponse(Auction auction, List<TeamConfig> teams) {
        List<String> eventList = auction.getEvents() == null || auction.getEvents().isBlank() ? List.of() : List.of(auction.getEvents().split("\\s*,\\s*"));
        return AuctionResponse.builder()
                .id(auction.getId())
                .auctionName(auction.getAuctionName())
                .eventName(auction.getEventName())
                .category(auction.getCategory())
                .events(eventList)
                .rosterRules(auction.getRosterRules())
                .allowRetention(auction.isAllowRetention())
                .maxRetainedPlayers(auction.getMaxRetainedPlayers())
                .auctionDate(auction.getAuctionDate())
                .description(auction.getDescription())
                .minimumBid(auction.getMinimumBid())
                .bidIncrement(auction.getBidIncrement())
                .maximumBid(auction.getMaximumBid())
                .status(auction.getStatus())
                .isDeleted(auction.isDeleted())
                .createdAt(auction.getCreatedAt())
                .updatedAt(auction.getUpdatedAt())
                .teams(teams)
                .build();
    }

    public List<AuctionPlayerResponse> getAuctionPlayers(Long auctionId, PlayerStatus status, String category, String search) {
        Specification<AuctionPlayer> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("auction").get("id"), auctionId));
            
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (category != null && !category.isEmpty()) {
                predicates.add(cb.equal(root.get("player").get("category"), category));
            }
            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("player").get("name")), searchPattern),
                    cb.like(cb.lower(root.get("player").get("phoneNumber")), searchPattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<AuctionPlayer> list = auctionPlayerRepository.findAll(spec);
        return list.stream().map(ap -> {
            AuctionTeam team = ap.getTeam();
            return AuctionPlayerResponse.builder()
                    .id(ap.getId())
                    .playerId(ap.getPlayer().getId())
                    .name(ap.getPlayer().getName())
                    .phoneNumber(ap.getPlayer().getPhoneNumber())
                    .email(ap.getPlayer().getEmail())
                    .gender(ap.getPlayer().getGender())
                    .age(ap.getPlayer().getAge())
                    .category(ap.getPlayer().getCategory())
                    .city(ap.getPlayer().getCity())
                    .state(ap.getPlayer().getState())
                    .skillLevel(ap.getPlayer().getSkillLevel())
                    .photoPath(ap.getPlayer().getPhotoPath())
                    .club(ap.getPlayer().getClub())
                    .basePrice(ap.getBasePrice())
                    .status(ap.getStatus())
                    .soldPrice(ap.getSoldPrice())
                    .teamId(team != null ? team.getId() : null)
                    .teamName(team != null ? team.getTeamName() : null)
                    .soldAt(ap.getSoldAt())
                    .isRetained(ap.isRetained())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public void clearAuctionPlayers(Long auctionId) {
        Auction auction = auctionRepository.findActiveById(auctionId)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + auctionId));

        if (auction.getStatus() != AuctionStatus.Draft) {
            throw new IllegalStateException("Players can only be removed from Draft auctions.");
        }

        // Restore teams purse
        List<AuctionTeam> teams = auctionTeamRepository.findByAuctionId(auctionId);
        for (AuctionTeam team : teams) {
            team.setRemainingPurse(team.getPurseAmount());
            auctionTeamRepository.save(team);
        }

        // Delete bids
        bidRepository.deleteByAuctionId(auctionId);

        // Delete auction players and corresponding players
        List<AuctionPlayer> players = auctionPlayerRepository.findByAuctionId(auctionId);
        for (AuctionPlayer ap : players) {
            Player p = ap.getPlayer();
            auctionPlayerRepository.delete(ap);
            playerRepository.delete(p);
        }
    }
}
