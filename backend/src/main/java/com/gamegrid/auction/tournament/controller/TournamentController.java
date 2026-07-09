package com.gamegrid.auction.tournament.controller;

import com.gamegrid.auction.tournament.dto.*;
import com.gamegrid.auction.tournament.service.TournamentService;
import com.gamegrid.auction.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Tournament Management APIs", description = "Endpoints for creating and managing tournaments, events, and participants")
public class TournamentController {

    private final TournamentService tournamentService;
    private final FileStorageService fileStorageService;

    @PostMapping("/tournaments")
    @Operation(summary = "Create a new tournament")
    public ResponseEntity<TournamentResponse> createTournament(@Valid @RequestBody TournamentRequest request) {
        TournamentResponse response = tournamentService.createTournament(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/tournaments")
    @Operation(summary = "Get list of tournaments with search filters and pagination")
    public ResponseEntity<Page<TournamentResponse>> getTournaments(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TournamentResponse> response = tournamentService.getTournamentsPage(search, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tournaments/{id}")
    @Operation(summary = "Get tournament details by ID")
    public ResponseEntity<TournamentResponse> getTournamentById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(tournamentService.getTournament(id));
    }

    @PutMapping("/tournaments/{id}")
    @Operation(summary = "Update tournament details")
    public ResponseEntity<TournamentResponse> updateTournament(
            @PathVariable("id") Long id,
            @Valid @RequestBody TournamentRequest request) {
        return ResponseEntity.ok(tournamentService.updateTournament(id, request));
    }

    @DeleteMapping("/tournaments/{id}")
    @Operation(summary = "Delete tournament and its events")
    public ResponseEntity<Void> deleteTournament(@PathVariable("id") Long id) {
        tournamentService.deleteTournament(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/tournaments/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload tournament logo")
    public ResponseEntity<String> uploadLogo(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file) {
        String savedPath = fileStorageService.storeFile(file, "logos");
        return ResponseEntity.ok(savedPath);
    }

    @PostMapping("/tournaments/{id}/events")
    @Operation(summary = "Add an event category to a tournament")
    public ResponseEntity<EventResponse> createEvent(
            @PathVariable("id") Long id,
            @Valid @RequestBody EventRequest request) {
        EventResponse response = tournamentService.createEvent(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/tournaments/{id}/events")
    @Operation(summary = "Get all events for a tournament")
    public ResponseEntity<List<EventResponse>> getEvents(@PathVariable("id") Long id) {
        return ResponseEntity.ok(tournamentService.getEventsForTournament(id));
    }

    @PostMapping(value = "/events/{id}/participants/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload event participant list via Excel spreadsheet")
    public ResponseEntity<Void> uploadParticipants(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file) {
        tournamentService.uploadParticipantsExcel(id, file);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/events/{id}/participants")
    @Operation(summary = "Register a single participant to a tournament event")
    public ResponseEntity<EventParticipantResponse> registerParticipant(
            @PathVariable("id") Long id,
            @Valid @RequestBody ParticipantRegistrationRequest request) {
        EventParticipantResponse response = tournamentService.registerParticipant(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/events/{id}/participants")
    @Operation(summary = "Get paginated participants list for an event")
    public ResponseEntity<Page<EventParticipantResponse>> getParticipants(
            @PathVariable("id") Long id,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"));
        return ResponseEntity.ok(tournamentService.getParticipantsForEvent(id, pageable));
    }

    @PutMapping("/participants/{id}/seed")
    @Operation(summary = "Assign manual seeding rank number to a participant")
    public ResponseEntity<EventParticipantResponse> updateSeed(
            @PathVariable("id") Long id,
            @RequestParam("seedNumber") Integer seedNumber) {
        return ResponseEntity.ok(tournamentService.updateParticipantSeed(id, seedNumber));
    }
}
