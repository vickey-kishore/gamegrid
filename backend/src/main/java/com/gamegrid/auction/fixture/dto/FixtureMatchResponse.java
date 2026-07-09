package com.gamegrid.auction.fixture.dto;

import com.gamegrid.auction.tournament.dto.EventParticipantResponse;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixtureMatchResponse {
    private Long id;
    private Long eventId;
    private int roundNumber;
    private int matchNumber;
    private EventParticipantResponse participant1;
    private EventParticipantResponse participant2;
    private LocalDateTime scheduledTime;
    private String courtNumber;
    private Long winnerId;
    private String winnerName;
}
