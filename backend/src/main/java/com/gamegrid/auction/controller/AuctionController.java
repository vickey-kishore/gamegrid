package com.gamegrid.auction.controller;

import com.gamegrid.auction.dto.AuctionPlayerResponse;
import com.gamegrid.auction.dto.AuctionRequest;
import com.gamegrid.auction.dto.AuctionResponse;
import com.gamegrid.auction.entity.Auction;
import com.gamegrid.auction.entity.AuctionStatus;
import com.gamegrid.auction.entity.PlayerStatus;
import com.gamegrid.auction.service.AuctionService;
import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auctions")
@RequiredArgsConstructor
@Tag(name = "Auction Management APIs", description = "Endpoints for creating, filtering, modifying, deleting, and starting auctions")
public class AuctionController {

    private final AuctionService auctionService;

    @PostMapping
    @Operation(summary = "Create a new auction along with teams and rules configuration")
    public ResponseEntity<AuctionResponse> createAuction(@Valid @RequestBody AuctionRequest request) {
        AuctionResponse response = auctionService.createAuction(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get list of auctions with filtering and pagination")
    public ResponseEntity<Page<Auction>> getAuctions(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        AuctionStatus statusEnum = null;
        if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            try {
                statusEnum = AuctionStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                // Ignore
            }
        }

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Auction> auctions = auctionService.getAuctions(search, statusEnum, pageable);
        return ResponseEntity.ok(auctions);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get auction details including participating teams by ID")
    public ResponseEntity<AuctionResponse> getAuctionById(@PathVariable("id") Long id) {
        AuctionResponse response = auctionService.getAuctionById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an auction (allowed only in Draft status)")
    public ResponseEntity<AuctionResponse> updateAuction(
            @PathVariable("id") Long id,
            @Valid @RequestBody AuctionRequest request) {
        AuctionResponse response = auctionService.updateAuction(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete an auction and clean up associations")
    public ResponseEntity<Void> deleteAuction(@PathVariable("id") Long id) {
        auctionService.deleteAuction(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Start/activate a draft auction and populate the bidding player pool")
    public ResponseEntity<Void> startAuction(@PathVariable("id") Long id) {
        auctionService.startAuction(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/players")
    @Operation(summary = "Get list of players in the auction with status and category filters")
    public ResponseEntity<List<AuctionPlayerResponse>> getAuctionPlayers(
            @PathVariable("id") Long auctionId,
            @RequestParam(value = "status", required = false) PlayerStatus status,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "search", required = false) String search) {
        List<AuctionPlayerResponse> response = auctionService.getAuctionPlayers(auctionId, status, category, search);
        return ResponseEntity.ok(response);
    }
}
