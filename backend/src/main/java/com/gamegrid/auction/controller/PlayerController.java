package com.gamegrid.auction.controller;

import com.gamegrid.auction.dto.PlayerImportResult;
import com.gamegrid.auction.entity.Player;
import com.gamegrid.auction.service.PlayerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
@Tag(name = "Player Management APIs", description = "Endpoints for importing and querying players")
public class PlayerController {

    private final PlayerService playerService;

    @PostMapping(value = "/import", consumes = "multipart/form-data")
    @Operation(summary = "Import registered players from an Excel sheet (optionally register directly to an auction)")
    public ResponseEntity<PlayerImportResult> importPlayers(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "auctionId", required = false) Long auctionId) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(PlayerImportResult.builder()
                    .errors(java.util.List.of("Uploaded file is empty."))
                    .build());
        }
        
        PlayerImportResult result;
        if (auctionId != null) {
            result = playerService.importPlayersForAuction(auctionId, file);
        } else {
            result = playerService.importPlayers(file);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping
    @Operation(summary = "Get list of players with filters, search, and pagination")
    public ResponseEntity<Page<Player>> getPlayers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "skillLevel", required = false) String skillLevel,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(value = "direction", defaultValue = "ASC") String direction) {

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Player> players = playerService.getPlayers(search, category, skillLevel, pageable);
        return ResponseEntity.ok(players);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get player details by ID")
    public ResponseEntity<Player> getPlayerById(@PathVariable("id") Long id) {
        return playerService.getPlayerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create a new player (optionally register directly to an auction)")
    public ResponseEntity<Player> createPlayer(
            @jakarta.validation.Valid @RequestBody com.gamegrid.auction.dto.PlayerRequest request,
            @RequestParam(value = "auctionId", required = false) Long auctionId) {
        Player player = playerService.createPlayer(request, auctionId);
        return new ResponseEntity<>(player, org.springframework.http.HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update player details")
    public ResponseEntity<Player> updatePlayer(
            @PathVariable("id") Long id,
            @jakarta.validation.Valid @RequestBody com.gamegrid.auction.dto.PlayerRequest request) {
        Player player = playerService.updatePlayer(id, request);
        return ResponseEntity.ok(player);
    }

    @DeleteMapping("/{id}/auction/{auctionId}")
    @Operation(summary = "Remove player from a specific auction")
    public ResponseEntity<Void> removePlayerFromAuction(
            @PathVariable("id") Long id,
            @PathVariable("auctionId") Long auctionId) {
        playerService.removePlayerFromAuction(auctionId, id);
        return ResponseEntity.ok().build();
    }
}
