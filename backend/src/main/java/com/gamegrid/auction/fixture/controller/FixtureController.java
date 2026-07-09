package com.gamegrid.auction.fixture.controller;

import com.gamegrid.auction.fixture.dto.FixtureMatchResponse;
import com.gamegrid.auction.fixture.service.FixtureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Fixture Engine APIs", description = "Endpoints for generating tournament draws, logging match results, and exporting PDF brackets")
public class FixtureController {

    private final FixtureService fixtureService;

    @PostMapping("/events/{id}/fixtures/generate")
    @Operation(summary = "Generate a new knockout bracket or round robin draw for an event")
    public ResponseEntity<List<FixtureMatchResponse>> generateFixtures(@PathVariable("id") Long id) {
        List<FixtureMatchResponse> response = fixtureService.generateFixtures(id);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/events/{id}/fixtures")
    @Operation(summary = "Get list of matches generated for an event")
    public ResponseEntity<List<FixtureMatchResponse>> getFixtures(@PathVariable("id") Long id) {
        return ResponseEntity.ok(fixtureService.getFixturesForEvent(id));
    }

    @PutMapping("/fixtures/{matchId}/winner")
    @Operation(summary = "Assign a winner to a match and advance them in knockout brackets")
    public ResponseEntity<FixtureMatchResponse> updateWinner(
            @PathVariable("matchId") Long matchId,
            @RequestParam("winnerId") Long winnerId) {
        return ResponseEntity.ok(fixtureService.updateMatchWinner(matchId, winnerId));
    }

    @PutMapping("/fixtures/{matchId}/schedule")
    @Operation(summary = "Assign scheduled time and court number to a match")
    public ResponseEntity<FixtureMatchResponse> updateSchedule(
            @PathVariable("matchId") Long matchId,
            @RequestParam(value = "scheduledTime", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime scheduledTime,
            @RequestParam(value = "courtNumber", required = false) String courtNumber) {
        return ResponseEntity.ok(fixtureService.updateMatchTimeAndCourt(matchId, scheduledTime, courtNumber));
    }

    @GetMapping(value = "/events/{id}/fixtures/pdf", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Export a printable bracket draw page (triggers browser print interface)")
    public ResponseEntity<String> exportPdfHtml(@PathVariable("id") Long id) {
        String html = fixtureService.generateFixturesPdfHtml(id);
        return ResponseEntity.ok(html);
    }
}
