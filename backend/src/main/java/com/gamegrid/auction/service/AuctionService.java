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

        Auction auction = Auction.builder()
                .auctionName(request.getAuctionName())
                .eventName(request.getEventName())
                .category(request.getCategory())
                .events(request.getEvents() == null ? null : String.join(",", request.getEvents()))
                .minMen(request.getMinMen() > 0 ? request.getMinMen() : 4)
                .minWomen(request.getMinWomen() > 0 ? request.getMinWomen() : 2)
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

        auction.setAuctionName(request.getAuctionName());
        auction.setEventName(request.getEventName());
        auction.setCategory(request.getCategory());
        auction.setEvents(request.getEvents() == null ? null : String.join(",", request.getEvents()));
        auction.setMinMen(request.getMinMen() > 0 ? request.getMinMen() : 4);
        auction.setMinWomen(request.getMinWomen() > 0 ? request.getMinWomen() : 2);
        auction.setAuctionDate(request.getAuctionDate());
        auction.setDescription(request.getDescription());
        auction.setMinimumBid(request.getMinimumBid());
        auction.setBidIncrement(request.getBidIncrement());
        auction.setMaximumBid(request.getMaximumBid());

        Auction savedAuction = auctionRepository.save(auction);

        // Delete existing teams and re-create them or update
        List<AuctionTeam> existingTeams = auctionTeamRepository.findByAuctionId(id);
        
        // Delete logos if necessary
        for (AuctionTeam et : existingTeams) {
            if (et.getLogoPath() != null && request.getTeams().stream().noneMatch(t -> et.getLogoPath().equals(t.getLogoPath()))) {
                try {
                    Files.deleteIfExists(Paths.get(et.getLogoPath()));
                } catch (IOException eloquence) {
                    // Ignore
                }
            }
        }
        auctionTeamRepository.deleteAll(existingTeams);

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
    public void startAuction(Long id) {
        Auction auction = auctionRepository.findActiveById(id)
                .orElseThrow(() -> new EntityNotFoundException("Auction not found with ID: " + id));

        if (auction.getStatus() != AuctionStatus.Draft) {
            throw new IllegalStateException("Only Draft auctions can be started.");
        }

        auction.setStatus(AuctionStatus.Active);
        auctionRepository.save(auction);

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

        // Validate enough registered players
        long registeredPlayerCount = 0;
        if (request.getEvents() != null && !request.getEvents().isEmpty()) {
            Specification<Player> spec = (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                for (String ev : request.getEvents()) {
                    predicates.add(cb.equal(cb.lower(root.get("category")), ev.toLowerCase().trim()));
                }
                return cb.or(predicates.toArray(new Predicate[0]));
            };
            registeredPlayerCount = playerRepository.count(spec);
        } else if (request.getCategory() != null && !request.getCategory().isBlank()) {
            Specification<Player> spec = (root, query, cb) -> 
                cb.equal(cb.lower(root.get("category")), request.getCategory().toLowerCase().trim());
            registeredPlayerCount = playerRepository.count(spec);
        }

        int requiredMinPlayers = request.getTeams().stream().mapToInt(TeamConfig::getMinimumPlayers).sum();

        if (registeredPlayerCount < requiredMinPlayers) {
            String categoryDesc = request.getEvents() != null ? String.join(", ", request.getEvents()) : request.getCategory();
            throw new IllegalArgumentException("Not enough registered players for this auction categories '" + categoryDesc 
                    + "'. Required minimum: " + requiredMinPlayers + ", Registered in categories: " + registeredPlayerCount);
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
                .minMen(auction.getMinMen())
                .minWomen(auction.getMinWomen())
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
                    .basePrice(ap.getBasePrice())
                    .status(ap.getStatus())
                    .soldPrice(ap.getSoldPrice())
                    .teamId(team != null ? team.getId() : null)
                    .teamName(team != null ? team.getTeamName() : null)
                    .soldAt(ap.getSoldAt())
                    .build();
        }).collect(Collectors.toList());
    }
}
