package com.gamegrid.auction.controller;

import com.gamegrid.auction.dto.BidRequest;
import com.gamegrid.auction.dto.BidResponse;
import com.gamegrid.auction.dto.SoldRequest;
import com.gamegrid.auction.dto.UnsoldRequest;
import com.gamegrid.auction.entity.Bid;
import com.gamegrid.auction.repository.BidRepository;
import com.gamegrid.auction.service.BiddingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Tag(name = "Bidding Engine APIs", description = "Endpoints for placing bids, submitting final player sales, or resetting players to unsold")
public class BidController {

    private final BiddingService biddingService;
    private final BidRepository bidRepository;

    @PostMapping("/api/bids")
    @Operation(summary = "Submit a bid for a player from a team")
    public ResponseEntity<BidResponse> placeBid(@Valid @RequestBody BidRequest request) {
        BidResponse response = biddingService.placeBid(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/api/bids/auction/{auctionId}/player/{playerId}")
    @Operation(summary = "Get bid logs for a specific player in an auction")
    public ResponseEntity<List<BidResponse>> getBidLogs(
            @PathVariable("auctionId") Long auctionId,
            @PathVariable("playerId") Long playerId) {
        List<Bid> bids = bidRepository.findByAuctionIdAndPlayerIdOrderByBidTimeDesc(auctionId, playerId);
        List<BidResponse> response = bids.stream()
                .map(b -> BidResponse.builder()
                        .id(b.getId())
                        .auctionId(b.getAuction().getId())
                        .playerId(b.getPlayer().getId())
                        .teamId(b.getTeam().getId())
                        .teamName(b.getTeam().getTeamName())
                        .bidAmount(b.getBidAmount())
                        .bidTime(b.getBidTime())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/players/{id}/sold")
    @Operation(summary = "Mark a player as sold to a team (with fallback to the highest bidder if details are omitted)")
    public ResponseEntity<Void> markPlayerSold(
            @PathVariable("id") Long playerId,
            @Valid @RequestBody SoldRequest request) {
        biddingService.markPlayerSold(playerId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/players/{id}/unsold")
    @Operation(summary = "Mark a player as unsold in the active auction")
    public ResponseEntity<Void> markPlayerUnsold(
            @PathVariable("id") Long playerId,
            @Valid @RequestBody UnsoldRequest request) {
        biddingService.markPlayerUnsold(playerId, request);
        return ResponseEntity.ok().build();
    }
}
