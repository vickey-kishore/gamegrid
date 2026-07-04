package com.gamegrid.auction.service;

import com.gamegrid.auction.dto.BidRequest;
import com.gamegrid.auction.dto.BidResponse;
import com.gamegrid.auction.dto.SoldRequest;
import com.gamegrid.auction.dto.UnsoldRequest;
import com.gamegrid.auction.entity.*;
import com.gamegrid.auction.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BiddingService {

    private final AuctionRepository auctionRepository;
    private final AuctionTeamRepository auctionTeamRepository;
    private final AuctionPlayerRepository auctionPlayerRepository;
    private final BidRepository bidRepository;

    @Transactional
    public BidResponse placeBid(BidRequest request) {
        Long auctionId = request.getAuctionId();
        Long playerId = request.getPlayerId();
        Long teamId = request.getTeamId();
        BigDecimal bidAmount = request.getBidAmount();

        // 1. Fetch and Lock the AuctionPlayer record for this auction/player to serialize bid attempts
        AuctionPlayer ap = auctionPlayerRepository.findByAuctionIdAndPlayerIdForUpdate(auctionId, playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player is not registered in this auction"));

        // 2. Validate Auction Status
        Auction auction = ap.getAuction();
        if (auction.isDeleted() || auction.getStatus() != AuctionStatus.Active) {
            throw new IllegalStateException("Bids can only be placed on an Active auction.");
        }

        // 3. Validate Player Status is Available
        if (ap.getStatus() != PlayerStatus.Available) {
            throw new IllegalStateException("Bids can only be placed on Available players.");
        }

        // 4. Fetch and Validate Bidding Team
        AuctionTeam team = auctionTeamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found with ID: " + teamId));
        if (!team.getAuction().getId().equals(auctionId)) {
            throw new IllegalArgumentException("Team does not belong to this auction.");
        }

        // 5. Validate Team Roster Slots and Budget constraints dynamically
        validateRosterConstraints(team, auction, ap.getPlayer(), bidAmount);

        // 7. Validate Bid Amount Constraints (Minimum bid, Increment rules, Max bid limit)
        Optional<Bid> highestBidOpt = bidRepository.findTopByAuctionIdAndPlayerIdOrderByBidAmountDesc(auctionId, playerId);
        if (highestBidOpt.isEmpty()) {
            if (bidAmount.compareTo(auction.getMinimumBid()) < 0) {
                throw new IllegalArgumentException("First bid must be at least the minimum bid of " + auction.getMinimumBid());
            }
        } else {
            Bid highestBid = highestBidOpt.get();
            BigDecimal nextMinBid = highestBid.getBidAmount().add(auction.getBidIncrement());
            if (bidAmount.compareTo(nextMinBid) < 0) {
                throw new IllegalArgumentException("Bid must increase by at least the increment of " + auction.getBidIncrement() + ". Minimum required: " + nextMinBid);
            }
            if (highestBid.getTeam().getId().equals(teamId)) {
                throw new IllegalArgumentException("Team " + team.getTeamName() + " already holds the highest bid.");
            }
        }

        if (auction.getMaximumBid() != null && bidAmount.compareTo(auction.getMaximumBid()) > 0) {
            throw new IllegalArgumentException("Bid amount exceeds the maximum bid limit of " + auction.getMaximumBid());
        }

        // 8. Save Bid
        Bid bid = Bid.builder()
                .auction(auction)
                .player(ap.getPlayer())
                .team(team)
                .bidAmount(bidAmount)
                .build();

        Bid savedBid = bidRepository.save(bid);

        return BidResponse.builder()
                .id(savedBid.getId())
                .auctionId(auctionId)
                .playerId(playerId)
                .teamId(teamId)
                .teamName(team.getTeamName())
                .bidAmount(bidAmount)
                .bidTime(LocalDateTime.now())
                .build();
    }

    @Transactional
    public void markPlayerSold(Long playerId, SoldRequest request) {
        Long auctionId = request.getAuctionId();
        Long teamId = request.getTeamId();
        BigDecimal soldPrice = request.getSoldPrice();

        // 1. Fetch & lock player record
        AuctionPlayer ap = auctionPlayerRepository.findByAuctionIdAndPlayerIdForUpdate(auctionId, playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player is not registered in this auction"));

        if (ap.getStatus() != PlayerStatus.Available) {
            throw new IllegalStateException("Player is not in Available status.");
        }

        // 2. Fetch winning parameters (if not provided, fetch from highest bid)
        if (teamId == null || soldPrice == null) {
            Bid highestBid = bidRepository.findTopByAuctionIdAndPlayerIdOrderByBidAmountDesc(auctionId, playerId)
                    .orElseThrow(() -> new IllegalArgumentException("No bids found for this player. Winning team and price must be specified manually."));
            teamId = highestBid.getTeam().getId();
            soldPrice = highestBid.getBidAmount();
        }

        AuctionTeam team = auctionTeamRepository.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Winning team not found"));

        if (!team.getAuction().getId().equals(auctionId)) {
            throw new IllegalArgumentException("Winning team does not belong to this auction.");
        }

        // 3. Verify budgets, slot limits, and gender minimum requirements one final time
        validateRosterConstraints(team, team.getAuction(), ap.getPlayer(), soldPrice);

        // 4. Update team budget
        team.setRemainingPurse(team.getRemainingPurse().subtract(soldPrice));
        auctionTeamRepository.save(team);

        // 5. Assign player to team and change status
        ap.setStatus(PlayerStatus.Sold);
        ap.setTeam(team);
        ap.setSoldPrice(soldPrice);
        ap.setSoldAt(LocalDateTime.now());
        auctionPlayerRepository.save(ap);
    }

    private void validateRosterConstraints(AuctionTeam team, Auction auction, Player player, BigDecimal purchaseAmount) {
        List<AuctionPlayer> boughtPlayers = auctionPlayerRepository.findByTeamId(team.getId());
        
        // 1. Max players check
        if (boughtPlayers.size() >= team.getMaximumPlayers()) {
            throw new IllegalStateException("Team " + team.getTeamName() + " has already purchased the maximum allowed players (" + team.getMaximumPlayers() + ").");
        }

        // 2. Budget check
        if (team.getRemainingPurse().compareTo(purchaseAmount) < 0) {
            throw new IllegalStateException("Purchase amount (" + purchaseAmount + ") exceeds team's remaining purse (" + team.getRemainingPurse() + ").");
        }

        // 3. Gender / Roster math check
        String playerGender = player.getGender();
        boolean isMale = playerGender != null && playerGender.equalsIgnoreCase("Men");
        boolean isFemale = playerGender != null && playerGender.equalsIgnoreCase("Women");

        long currentMen = boughtPlayers.stream().filter(p -> p.getPlayer().getGender() != null && p.getPlayer().getGender().equalsIgnoreCase("Men")).count();
        long currentWomen = boughtPlayers.stream().filter(p -> p.getPlayer().getGender() != null && p.getPlayer().getGender().equalsIgnoreCase("Women")).count();

        long nextMen = currentMen + (isMale ? 1 : 0);
        long nextWomen = currentWomen + (isFemale ? 1 : 0);

        int minMen = auction.getMinMen();
        int minWomen = auction.getMinWomen();
        int maxPlayers = team.getMaximumPlayers();
        int nextTotal = boughtPlayers.size() + 1;

        long menNeeded = Math.max(0, minMen - nextMen);
        long womenNeeded = Math.max(0, minWomen - nextWomen);
        int slotsLeft = maxPlayers - nextTotal;

        if (menNeeded + womenNeeded > slotsLeft) {
            throw new IllegalStateException("Bidding on this player would leave " + slotsLeft + " slots, which is insufficient to purchase the remaining required " + menNeeded + " Men and " + womenNeeded + " Women.");
        }

        BigDecimal nextRemainingPurse = team.getRemainingPurse().subtract(purchaseAmount);
        BigDecimal requiredBudget = BigDecimal.valueOf(menNeeded + womenNeeded).multiply(auction.getMinimumBid());

        if (nextRemainingPurse.compareTo(requiredBudget) < 0) {
            throw new IllegalStateException("Bidding this amount leaves a remaining budget of " + nextRemainingPurse + ", which is insufficient to purchase the remaining required players at the base price of " + auction.getMinimumBid() + " (Requires: " + requiredBudget + ").");
        }
    }

    @Transactional
    public void markPlayerUnsold(Long playerId, UnsoldRequest request) {
        Long auctionId = request.getAuctionId();

        AuctionPlayer ap = auctionPlayerRepository.findByAuctionIdAndPlayerIdForUpdate(auctionId, playerId)
                .orElseThrow(() -> new EntityNotFoundException("Player is not registered in this auction"));

        if (ap.getStatus() != PlayerStatus.Available) {
            throw new IllegalStateException("Player is not in Available status.");
        }

        ap.setStatus(PlayerStatus.Unsold);
        auctionPlayerRepository.save(ap);
    }
}
