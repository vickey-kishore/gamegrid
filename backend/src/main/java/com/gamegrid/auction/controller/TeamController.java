package com.gamegrid.auction.controller;

import com.gamegrid.auction.dto.TeamConfig;
import com.gamegrid.auction.dto.TeamRosterDto;
import com.gamegrid.auction.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Team Management APIs", description = "Endpoints for managing teams, viewing rosters, and exporting team worksheets")
public class TeamController {

    private final TeamService teamService;

    @PostMapping("/api/auctions/{id}/teams")
    @Operation(summary = "Add a new team to a draft auction")
    public ResponseEntity<TeamConfig> addTeamToAuction(
            @PathVariable("id") Long auctionId,
            @Valid @RequestBody TeamConfig config) {
        TeamConfig response = teamService.addTeamToAuction(auctionId, config);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/api/auctions/{id}/teams")
    @Operation(summary = "Get list of teams registered in an auction")
    public ResponseEntity<List<TeamConfig>> getTeamsForAuction(@PathVariable("id") Long auctionId) {
        List<TeamConfig> response = teamService.getTeamsForAuction(auctionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/teams/{id}/roster")
    @Operation(summary = "Get a team's current roster and financial status")
    public ResponseEntity<TeamRosterDto> getTeamRoster(@PathVariable("id") Long teamId) {
        TeamRosterDto response = teamService.getTeamRoster(teamId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/teams/{id}/roster/export")
    @Operation(summary = "Export a team's roster to an Excel spreadsheet")
    public ResponseEntity<byte[]> exportRosterToExcel(@PathVariable("id") Long teamId) throws IOException {
        byte[] data = teamService.exportRosterToExcel(teamId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("team_roster_" + teamId + ".xlsx")
                .build());

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }
}
