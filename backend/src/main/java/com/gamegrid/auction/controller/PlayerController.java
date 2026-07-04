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
    @Operation(summary = "Import registered players from an Excel sheet")
    public ResponseEntity<PlayerImportResult> importPlayers(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(PlayerImportResult.builder()
                    .errors(java.util.List.of("Uploaded file is empty."))
                    .build());
        }
        
        PlayerImportResult result = playerService.importPlayers(file);
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
}
